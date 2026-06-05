/**
 * Client tasks repository — DB layer for the `client_tasks` table.
 */

import type { AsyncDb } from '$lib/server/db';
import type {
  ClientTaskDto,
  ClientTaskPriority,
  ClientTaskStatus,
  ClientTaskType
} from '$lib/staff-portal/clients.dto';

interface TaskRow {
  id: string;
  client_id: string;
  type: string;
  title: string;
  description: string | null;
  due_at: string;
  assigned_staff_id: string | null;
  status: string;
  priority: string;
  completed_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: TaskRow): ClientTaskDto {
  return {
    id: row.id,
    clientId: row.client_id,
    type: row.type as ClientTaskType,
    title: row.title,
    description: row.description,
    dueAt: row.due_at,
    assignedStaffId: row.assigned_staff_id,
    status: row.status as ClientTaskStatus,
    priority: row.priority as ClientTaskPriority,
    completedAt: row.completed_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listClientTasks(
  db: AsyncDb,
  clientId: string
): Promise<ClientTaskDto[]> {
  const rows = await db.queryAll<TaskRow>(
    'SELECT * FROM client_tasks WHERE client_id = ? ORDER BY due_at ASC',
    clientId
  );
  return rows.map(mapRow);
}

export interface InsertTaskInput {
  id: string;
  clientId: string;
  type: ClientTaskType;
  title: string;
  description: string | null;
  dueAt: string;
  assignedStaffId: string | null;
  status: ClientTaskStatus;
  priority: ClientTaskPriority;
  createdBy: string;
}

export async function insertClientTask(
  db: AsyncDb,
  input: InsertTaskInput
): Promise<ClientTaskDto> {
  const now = new Date().toISOString();
  await db.exec(
    `INSERT INTO client_tasks (
      id, client_id, type, title, description, due_at,
      assigned_staff_id, status, priority, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.id,
    input.clientId,
    input.type,
    input.title,
    input.description,
    input.dueAt,
    input.assignedStaffId,
    input.status,
    input.priority,
    input.createdBy,
    now,
    now
  );
  const row = await db.queryOne<TaskRow>('SELECT * FROM client_tasks WHERE id = ?', input.id);
  if (!row) throw new Error('insertClientTask: row not found after insert');
  return mapRow(row);
}

export interface UpdateTaskInput {
  type?: ClientTaskType;
  title?: string;
  description?: string | null;
  dueAt?: string;
  assignedStaffId?: string | null;
  status?: ClientTaskStatus;
  priority?: ClientTaskPriority;
}

export async function updateClientTask(
  db: AsyncDb,
  clientId: string,
  id: string,
  patch: UpdateTaskInput
): Promise<ClientTaskDto | null> {
  const sets: string[] = [];
  const params: unknown[] = [];

  if (patch.type !== undefined) { sets.push('type = ?'); params.push(patch.type); }
  if (patch.title !== undefined) { sets.push('title = ?'); params.push(patch.title); }
  if (patch.description !== undefined) { sets.push('description = ?'); params.push(patch.description); }
  if (patch.dueAt !== undefined) { sets.push('due_at = ?'); params.push(patch.dueAt); }
  if (patch.assignedStaffId !== undefined) { sets.push('assigned_staff_id = ?'); params.push(patch.assignedStaffId); }
  if (patch.priority !== undefined) { sets.push('priority = ?'); params.push(patch.priority); }
  if (patch.status !== undefined) {
    sets.push('status = ?');
    params.push(patch.status);
    if (patch.status === 'completed') {
      sets.push('completed_at = ?');
      params.push(new Date().toISOString());
    } else if (patch.status === 'open' || patch.status === 'in_progress') {
      sets.push('completed_at = NULL');
    }
  }

  if (sets.length === 0) {
    const row = await db.queryOne<TaskRow>(
      'SELECT * FROM client_tasks WHERE client_id = ? AND id = ?',
      clientId, id
    );
    return row ? mapRow(row) : null;
  }

  sets.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(clientId);
  params.push(id);

  await db.exec(
    `UPDATE client_tasks SET ${sets.join(', ')} WHERE client_id = ? AND id = ?`,
    ...params
  );
  const row = await db.queryOne<TaskRow>(
    'SELECT * FROM client_tasks WHERE client_id = ? AND id = ?',
    clientId, id
  );
  return row ? mapRow(row) : null;
}

export async function deleteClientTask(
  db: AsyncDb,
  clientId: string,
  id: string
): Promise<boolean> {
  await db.exec(
    'DELETE FROM client_tasks WHERE client_id = ? AND id = ?',
    clientId, id
  );
  return true;
}
