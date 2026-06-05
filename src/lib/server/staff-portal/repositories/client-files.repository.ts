/**
 * Client files repository — DB layer for the `client_files` table.
 *
 * R2 storage is handled at the API/service layer; this module only
 * stores the metadata and R2 keys.
 */

import type { AsyncDb } from '$lib/server/db';
import type { ClientFileDto, ClientFileCategory } from '$lib/staff-portal/clients.dto';

interface FileRow {
  id: string;
  client_id: string;
  file_name: string;
  file_type: string;
  category: string;
  size_bytes: number;
  r2_key: string;
  description: string | null;
  uploaded_by: string;
  uploaded_at: string;
}

function mapRow(row: FileRow): ClientFileDto {
  return {
    id: row.id,
    clientId: row.client_id,
    fileName: row.file_name,
    fileType: row.file_type,
    category: (row.category as ClientFileCategory) ?? 'other',
    sizeBytes: row.size_bytes,
    description: row.description,
    uploadedBy: row.uploaded_by,
    uploadedAt: row.uploaded_at,
    r2Key: row.r2_key
  };
}

export async function listClientFiles(
  db: AsyncDb,
  clientId: string
): Promise<ClientFileDto[]> {
  const rows = await db.queryAll<FileRow>(
    'SELECT * FROM client_files WHERE client_id = ? ORDER BY uploaded_at DESC',
    clientId
  );
  return rows.map(mapRow);
}

export interface InsertClientFileInput {
  id: string;
  clientId: string;
  fileName: string;
  fileType: string;
  category: ClientFileCategory;
  sizeBytes: number;
  r2Key: string;
  description: string | null;
  uploadedBy: string;
}

export async function insertClientFile(
  db: AsyncDb,
  input: InsertClientFileInput
): Promise<ClientFileDto> {
  await db.exec(
    `INSERT INTO client_files (
      id, client_id, file_name, file_type, category, size_bytes, r2_key, description, uploaded_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.id,
    input.clientId,
    input.fileName,
    input.fileType,
    input.category,
    input.sizeBytes,
    input.r2Key,
    input.description,
    input.uploadedBy
  );
  const row = await db.queryOne<FileRow>(
    'SELECT * FROM client_files WHERE id = ?',
    input.id
  );
  if (!row) throw new Error('insertClientFile: file not found after insert');
  return mapRow(row);
}

export async function deleteClientFiles(
  db: AsyncDb,
  clientId: string,
  fileIds: string[]
): Promise<ClientFileDto[]> {
  if (fileIds.length === 0) return [];

  // Load the rows so we can return R2 keys for the caller to clean up.
  const placeholders = fileIds.map(() => '?').join(',');
  const rows = await db.queryAll<FileRow>(
    `SELECT * FROM client_files WHERE client_id = ? AND id IN (${placeholders})`,
    clientId,
    ...fileIds
  );
  if (rows.length === 0) return [];

  await db.exec(
    `DELETE FROM client_files WHERE client_id = ? AND id IN (${placeholders})`,
    clientId,
    ...fileIds
  );
  return rows.map(mapRow);
}

export async function findClientFileById(
  db: AsyncDb,
  clientId: string,
  fileId: string
): Promise<ClientFileDto | null> {
  const row = await db.queryOne<FileRow>(
    'SELECT * FROM client_files WHERE client_id = ? AND id = ?',
    clientId,
    fileId
  );
  return row ? mapRow(row) : null;
}
