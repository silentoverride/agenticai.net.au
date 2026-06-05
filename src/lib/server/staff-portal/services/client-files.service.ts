/**
 * Client files service — R2-backed file storage for client records.
 *
 * Module: Epic 11 — Clients CRM (post-MVP track), Story 11.3.
 *
 * R2 layout: clients/{clientId}/{fileId}-{filename}
 * Mime validation: enforced at the service layer (server-side trust).
 * Size limit: 10 MB per file in MVP.
 */

import { randomUUID } from 'node:crypto';
import type { AsyncDb } from '$lib/server/db';
import { clientFileMetaSchema } from '$lib/staff-portal/clients.dto';
import type { ClientFileDto, ClientFileCategory } from '$lib/staff-portal/clients.dto';
import {
  deleteClientFiles,
  findClientFileById,
  insertClientFile,
  listClientFiles
} from '../repositories/client-files.repository';
import { findClientById } from '../repositories/clients.repository';
import { logCrmAudit } from '../repositories/crm-audit.repository';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_PREFIXES = [
  'image/',
  'application/pdf',
  'text/',
  'audio/',
  'video/',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint'
];

function isAllowedMime(mime: string): boolean {
  if (!mime) return false;
  return ALLOWED_MIME_PREFIXES.some((p) => mime.startsWith(p));
}

export interface UploadContext {
  r2: R2Bucket;
  actorId: string;
  clientId: string;
  file: File;
  category: ClientFileCategory;
  description?: string | null;
}

export async function uploadClientFile(
  db: AsyncDb,
  ctx: UploadContext
): Promise<ClientFileDto> {
  // Validate that the client exists
  const client = await findClientById(db, ctx.clientId);
  if (!client) throw new Error('Client not found');

  // Validate file
  if (ctx.file.size === 0) throw new Error('File is empty');
  if (ctx.file.size > MAX_FILE_SIZE) {
    throw new Error(`File exceeds 10MB limit (got ${(ctx.file.size / 1024 / 1024).toFixed(2)}MB)`);
  }
  if (!isAllowedMime(ctx.file.type)) {
    throw new Error(`Mime type not allowed: ${ctx.file.type}`);
  }

  const id = randomUUID();
  const safeName = ctx.file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
  const r2Key = `clients/${ctx.clientId}/${id}-${safeName}`;

  // Upload to R2. Use arrayBuffer() to get a fixed-length Uint8Array
  // (R2.put with a Web ReadableStream requires a known length).
  const body = new Uint8Array(await ctx.file.arrayBuffer());
  await ctx.r2.put(r2Key, body, {
    httpMetadata: { contentType: ctx.file.type }
  });

  // Insert metadata row
  const dto = await insertClientFile(db, {
    id,
    clientId: ctx.clientId,
    fileName: ctx.file.name,
    fileType: ctx.file.type,
    category: ctx.category,
    sizeBytes: ctx.file.size,
    r2Key,
    description: ctx.description ?? null,
    uploadedBy: ctx.actorId
  });

  await logCrmAudit(db, {
    id: randomUUID(),
    clientId: ctx.clientId,
    targetType: 'client_file',
    targetId: id,
    actorId: ctx.actorId,
    action: 'upload',
    metadata: { fileName: ctx.file.name, sizeBytes: ctx.file.size, category: ctx.category }
  });

  return dto;
}

export async function getClientFiles(
  db: AsyncDb,
  clientId: string
): Promise<ClientFileDto[]> {
  return listClientFiles(db, clientId);
}

export interface DownloadContext {
  r2: R2Bucket;
  actorId: string;
  clientId: string;
  fileId: string;
}

export interface DownloadResult {
  file: ClientFileDto;
  body: ReadableStream;
  contentType: string;
}

export async function downloadClientFile(
  db: AsyncDb,
  ctx: DownloadContext
): Promise<DownloadResult | null> {
  const file = await findClientFileById(db, ctx.clientId, ctx.fileId);
  if (!file || !file.r2Key) return null;
  const obj = await ctx.r2.get(file.r2Key);
  if (!obj) return null;

  await logCrmAudit(db, {
    id: randomUUID(),
    clientId: ctx.clientId,
    targetType: 'client_file',
    targetId: ctx.fileId,
    actorId: ctx.actorId,
    action: 'download',
    metadata: { fileName: file.fileName }
  });

  return {
    file,
    body: obj.body,
    contentType: file.fileType
  };
}

export interface DeleteFilesContext {
  r2: R2Bucket;
  actorId: string;
  clientId: string;
  fileIds: string[];
}

export async function removeClientFiles(
  db: AsyncDb,
  ctx: DeleteFilesContext
): Promise<number> {
  const removed = await deleteClientFiles(db, ctx.clientId, ctx.fileIds);
  // R2 delete uses the keys we just removed. r2Key is preserved on the DTO
  // by the repo (see mapRow above); the service strips it before returning
  // to the client if needed.
  await Promise.allSettled(
    removed.filter((f): f is ClientFileDto & { r2Key: string } => Boolean(f.r2Key)).map((f) => ctx.r2.delete(f.r2Key))
  );
  if (removed.length > 0) {
    await logCrmAudit(db, {
      id: randomUUID(),
      clientId: ctx.clientId,
      targetType: 'client_file',
      targetId: null,
      actorId: ctx.actorId,
      action: 'delete',
      metadata: { count: removed.length, fileIds: ctx.fileIds }
    });
  }
  return removed.length;
}

export function parseFileMeta(input: unknown) {
  return clientFileMetaSchema.parse(input);
}
