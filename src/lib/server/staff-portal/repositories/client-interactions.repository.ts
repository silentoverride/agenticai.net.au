/**
 * Client interactions repository — DB layer for the `client_interactions` table.
 */

import type { AsyncDb } from '$lib/server/db';
import type {
  ClientInteractionDto,
  ClientInteractionFilters,
  ClientInteractionType
} from '$lib/staff-portal/clients.dto';

interface InteractionRow {
  id: string;
  client_id: string;
  type: string;
  staff_id: string;
  summary: string;
  occurred_at: string;
  linked_file_ids: string; // JSON
  linked_task_ids: string; // JSON
  created_at: string;
  updated_at: string;
}

function safeJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

function mapRow(row: InteractionRow): ClientInteractionDto {
  return {
    id: row.id,
    clientId: row.client_id,
    type: row.type as ClientInteractionType,
    staffId: row.staff_id,
    summary: row.summary,
    occurredAt: row.occurred_at,
    linkedFileIds: safeJsonArray(row.linked_file_ids),
    linkedTaskIds: safeJsonArray(row.linked_task_ids),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listClientInteractions(
  db: AsyncDb,
  clientId: string,
  filters: ClientInteractionFilters = {}
): Promise<ClientInteractionDto[]> {
  const where: string[] = ['client_id = ?'];
  const params: unknown[] = [clientId];

  if (filters.type) {
    where.push('type = ?');
    params.push(filters.type);
  }
  if (filters.staffId) {
    where.push('staff_id = ?');
    params.push(filters.staffId);
  }
  if (filters.from) {
    where.push('occurred_at >= ?');
    params.push(filters.from);
  }
  if (filters.to) {
    where.push('occurred_at <= ?');
    params.push(filters.to);
  }

  const rows = await db.queryAll<InteractionRow>(
    `SELECT * FROM client_interactions WHERE ${where.join(' AND ')} ORDER BY occurred_at DESC LIMIT 500`,
    ...params
  );
  return rows.map(mapRow);
}

export interface InsertInteractionInput {
  id: string;
  clientId: string;
  type: ClientInteractionType;
  staffId: string;
  summary: string;
  occurredAt: string;
  linkedFileIds: string[];
  linkedTaskIds: string[];
}

export async function insertClientInteraction(
  db: AsyncDb,
  input: InsertInteractionInput
): Promise<ClientInteractionDto> {
  const now = new Date().toISOString();
  await db.exec(
    `INSERT INTO client_interactions (
      id, client_id, type, staff_id, summary, occurred_at,
      linked_file_ids, linked_task_ids, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.id,
    input.clientId,
    input.type,
    input.staffId,
    input.summary,
    input.occurredAt,
    JSON.stringify(input.linkedFileIds),
    JSON.stringify(input.linkedTaskIds),
    now,
    now
  );
  const row = await db.queryOne<InteractionRow>(
    'SELECT * FROM client_interactions WHERE id = ?',
    input.id
  );
  if (!row) throw new Error('insertClientInteraction: row not found after insert');
  return mapRow(row);
}

export interface UpdateInteractionInput {
  type?: ClientInteractionType;
  summary?: string;
  occurredAt?: string;
  staffId?: string;
  linkedFileIds?: string[];
  linkedTaskIds?: string[];
}

export async function updateClientInteraction(
  db: AsyncDb,
  clientId: string,
  id: string,
  patch: UpdateInteractionInput
): Promise<ClientInteractionDto | null> {
  const sets: string[] = [];
  const params: unknown[] = [];

  if (patch.type !== undefined) { sets.push('type = ?'); params.push(patch.type); }
  if (patch.summary !== undefined) { sets.push('summary = ?'); params.push(patch.summary); }
  if (patch.occurredAt !== undefined) { sets.push('occurred_at = ?'); params.push(patch.occurredAt); }
  if (patch.staffId !== undefined) { sets.push('staff_id = ?'); params.push(patch.staffId); }
  if (patch.linkedFileIds !== undefined) { sets.push('linked_file_ids = ?'); params.push(JSON.stringify(patch.linkedFileIds)); }
  if (patch.linkedTaskIds !== undefined) { sets.push('linked_task_ids = ?'); params.push(JSON.stringify(patch.linkedTaskIds)); }

  if (sets.length === 0) {
    const row = await db.queryOne<InteractionRow>(
      'SELECT * FROM client_interactions WHERE client_id = ? AND id = ?',
      clientId, id
    );
    return row ? mapRow(row) : null;
  }

  sets.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(clientId);
  params.push(id);

  await db.exec(
    `UPDATE client_interactions SET ${sets.join(', ')} WHERE client_id = ? AND id = ?`,
    ...params
  );
  const row = await db.queryOne<InteractionRow>(
    'SELECT * FROM client_interactions WHERE client_id = ? AND id = ?',
    clientId, id
  );
  return row ? mapRow(row) : null;
}

export async function deleteClientInteraction(
  db: AsyncDb,
  clientId: string,
  id: string
): Promise<boolean> {
  await db.exec(
    'DELETE FROM client_interactions WHERE client_id = ? AND id = ?',
    clientId, id
  );
  return true;
}
