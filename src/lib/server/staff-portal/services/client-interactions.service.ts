/**
 * Client interactions service — business logic + audit for interactions.
 */

import { randomUUID } from 'node:crypto';
import type { AsyncDb } from '$lib/server/db';
import {
  clientInteractionSchema,
  clientInteractionUpdateSchema
} from '$lib/staff-portal/clients.dto';
import type {
  ClientInteractionDto,
  ClientInteractionFilters
} from '$lib/staff-portal/clients.dto';
import {
  deleteClientInteraction,
  insertClientInteraction,
  listClientInteractions,
  updateClientInteraction
} from '../repositories/client-interactions.repository';
import { logCrmAudit } from '../repositories/crm-audit.repository';

export async function listInteractions(
  db: AsyncDb,
  clientId: string,
  filters: ClientInteractionFilters
): Promise<ClientInteractionDto[]> {
  return listClientInteractions(db, clientId, filters);
}

export interface CreateInteractionServiceInput {
  actorId: string;
  clientId: string;
  body: unknown;
}

export async function createInteraction(
  db: AsyncDb,
  input: CreateInteractionServiceInput
): Promise<ClientInteractionDto> {
  const parsed = clientInteractionSchema.parse(input.body);
  const id = randomUUID();
  const dto = await insertClientInteraction(db, {
    id,
    clientId: input.clientId,
    type: parsed.type,
    staffId: parsed.staffId || input.actorId,
    summary: parsed.summary,
    occurredAt: parsed.occurredAt,
    linkedFileIds: parsed.linkedFileIds,
    linkedTaskIds: parsed.linkedTaskIds
  });
  await logCrmAudit(db, {
    id: randomUUID(),
    clientId: input.clientId,
    targetType: 'client_interaction',
    targetId: id,
    actorId: input.actorId,
    action: 'create',
    metadata: { type: parsed.type }
  });
  return dto;
}

export interface UpdateInteractionServiceInput {
  actorId: string;
  clientId: string;
  interactionId: string;
  body: unknown;
}

export async function editInteraction(
  db: AsyncDb,
  input: UpdateInteractionServiceInput
): Promise<ClientInteractionDto | null> {
  const parsed = clientInteractionUpdateSchema.parse(input.body);
  const normalized: Parameters<typeof updateClientInteraction>[3] = {};
  if (parsed.type !== undefined) normalized.type = parsed.type;
  if (parsed.summary !== undefined) normalized.summary = parsed.summary;
  if (parsed.occurredAt !== undefined) normalized.occurredAt = parsed.occurredAt;
  if (parsed.staffId !== undefined) normalized.staffId = parsed.staffId ?? '';
  if (parsed.linkedFileIds !== undefined) normalized.linkedFileIds = parsed.linkedFileIds;
  if (parsed.linkedTaskIds !== undefined) normalized.linkedTaskIds = parsed.linkedTaskIds;
  const updated = await updateClientInteraction(
    db,
    input.clientId,
    input.interactionId,
    normalized
  );
  if (updated) {
    await logCrmAudit(db, {
      id: randomUUID(),
      clientId: input.clientId,
      targetType: 'client_interaction',
      targetId: input.interactionId,
      actorId: input.actorId,
      action: 'update',
      metadata: { changedFields: Object.keys(parsed) }
    });
  }
  return updated;
}

export async function removeInteraction(
  db: AsyncDb,
  actorId: string,
  clientId: string,
  interactionId: string
): Promise<boolean> {
  const ok = await deleteClientInteraction(db, clientId, interactionId);
  if (ok) {
    await logCrmAudit(db, {
      id: randomUUID(),
      clientId,
      targetType: 'client_interaction',
      targetId: interactionId,
      actorId,
      action: 'delete'
    });
  }
  return ok;
}
