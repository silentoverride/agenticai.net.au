/**
 * Client tasks service — business logic + audit for tasks/appointments.
 */

import { randomUUID } from 'node:crypto';
import type { AsyncDb } from '$lib/server/db';
import {
  clientTaskSchema,
  clientTaskUpdateSchema
} from '$lib/staff-portal/clients.dto';
import type { ClientTaskDto } from '$lib/staff-portal/clients.dto';
import {
  deleteClientTask,
  insertClientTask,
  listClientTasks,
  updateClientTask
} from '../repositories/client-tasks.repository';
import { logCrmAudit } from '../repositories/crm-audit.repository';

export async function listTasks(db: AsyncDb, clientId: string): Promise<ClientTaskDto[]> {
  return listClientTasks(db, clientId);
}

export interface CreateTaskServiceInput {
  actorId: string;
  clientId: string;
  body: unknown;
}

export async function createTask(
  db: AsyncDb,
  input: CreateTaskServiceInput
): Promise<ClientTaskDto> {
  const parsed = clientTaskSchema.parse(input.body);
  const id = randomUUID();
  const dto = await insertClientTask(db, {
    id,
    clientId: input.clientId,
    type: parsed.type,
    title: parsed.title,
    description: parsed.description || null,
    dueAt: parsed.dueAt,
    assignedStaffId: parsed.assignedStaffId || null,
    status: parsed.status,
    priority: parsed.priority,
    createdBy: input.actorId
  });
  await logCrmAudit(db, {
    id: randomUUID(),
    clientId: input.clientId,
    targetType: 'client_task',
    targetId: id,
    actorId: input.actorId,
    action: 'create',
    metadata: { type: parsed.type, title: parsed.title }
  });
  return dto;
}

export interface UpdateTaskServiceInput {
  actorId: string;
  clientId: string;
  taskId: string;
  body: unknown;
}

export async function editTask(
  db: AsyncDb,
  input: UpdateTaskServiceInput
): Promise<ClientTaskDto | null> {
  const parsed = clientTaskUpdateSchema.parse(input.body);
  const normalized: Parameters<typeof updateClientTask>[3] = {};
  if (parsed.type !== undefined) normalized.type = parsed.type;
  if (parsed.title !== undefined) normalized.title = parsed.title;
  if (parsed.description !== undefined) normalized.description = parsed.description || null;
  if (parsed.dueAt !== undefined) normalized.dueAt = parsed.dueAt;
  if (parsed.assignedStaffId !== undefined) normalized.assignedStaffId = parsed.assignedStaffId || null;
  if (parsed.status !== undefined) normalized.status = parsed.status;
  if (parsed.priority !== undefined) normalized.priority = parsed.priority;

  const updated = await updateClientTask(db, input.clientId, input.taskId, normalized);
  if (updated) {
    await logCrmAudit(db, {
      id: randomUUID(),
      clientId: input.clientId,
      targetType: 'client_task',
      targetId: input.taskId,
      actorId: input.actorId,
      action: 'update',
      metadata: { changedFields: Object.keys(parsed) }
    });
  }
  return updated;
}

export async function removeTask(
  db: AsyncDb,
  actorId: string,
  clientId: string,
  taskId: string
): Promise<boolean> {
  const ok = await deleteClientTask(db, clientId, taskId);
  if (ok) {
    await logCrmAudit(db, {
      id: randomUUID(),
      clientId,
      targetType: 'client_task',
      targetId: taskId,
      actorId,
      action: 'delete'
    });
  }
  return ok;
}
