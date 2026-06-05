/**
 * Clients service — business logic + audit + RBAC for the clients domain.
 *
 * Module: Epic 11 — Clients CRM (post-MVP track).
 * Pattern mirrors src/lib/server/staff-portal/services/*.ts.
 */

import { randomUUID } from 'node:crypto';
import type { AsyncDb } from '$lib/server/db';
import {
  clientCompanySchema,
  clientUpdateSchema
} from '$lib/staff-portal/clients.dto';
import type {
  ClientDto,
  ClientListFilters,
  ClientListResultDto
} from '$lib/staff-portal/clients.dto';
import {
  deleteClient,
  findClientById,
  insertClient,
  listClients,
  updateClient
} from '../repositories/clients.repository';
import { logCrmAudit } from '../repositories/crm-audit.repository';

export interface CreateClientServiceInput {
  actorId: string;
  body: unknown;
}

export async function createClient(
  db: AsyncDb,
  input: CreateClientServiceInput
): Promise<ClientDto> {
  const parsed = clientCompanySchema.parse(input.body);
  const id = randomUUID();

  const dto = await insertClient(db, {
    id,
    companyName: parsed.companyName,
    tradingName: parsed.tradingName ?? null,
    primaryContactName: parsed.primaryContactName ?? null,
    jobTitle: parsed.jobTitle ?? null,
    email: parsed.email || null,
    phone: parsed.phone || null,
    secondaryPhone: parsed.secondaryPhone || null,
    website: parsed.website || null,
    billingAddress: parsed.billingAddress || null,
    shippingAddress: parsed.shippingAddress || null,
    taxId: parsed.taxId || null,
    industry: parsed.industry ?? null,
    companySize: parsed.companySize ?? null,
    leadSource: parsed.leadSource ?? null,
    assignedStaffId: parsed.assignedStaffId || null,
    status: parsed.status,
    tags: parsed.tags,
    customFields: parsed.customFields
  });

  await logCrmAudit(db, {
    id: randomUUID(),
    clientId: id,
    targetType: 'client',
    targetId: id,
    actorId: input.actorId,
    action: 'create',
    metadata: { companyName: dto.companyName }
  });

  return dto;
}

export async function getClient(db: AsyncDb, id: string): Promise<ClientDto | null> {
  return findClientById(db, id);
}

export async function listClientsForOperator(
  db: AsyncDb,
  filters: ClientListFilters
): Promise<ClientListResultDto> {
  return listClients(db, filters);
}

export interface UpdateClientServiceInput {
  actorId: string;
  clientId: string;
  body: unknown;
}

export async function editClient(
  db: AsyncDb,
  input: UpdateClientServiceInput
): Promise<ClientDto | null> {
  const parsed = clientUpdateSchema.parse(input.body);
  const existing = await findClientById(db, input.clientId);
  if (!existing) return null;

  const updated = await updateClient(db, input.clientId, {
    companyName: parsed.companyName,
    tradingName: parsed.tradingName,
    primaryContactName: parsed.primaryContactName,
    jobTitle: parsed.jobTitle,
    email: parsed.email,
    phone: parsed.phone,
    secondaryPhone: parsed.secondaryPhone,
    website: parsed.website,
    billingAddress: parsed.billingAddress,
    shippingAddress: parsed.shippingAddress,
    taxId: parsed.taxId,
    industry: parsed.industry,
    companySize: parsed.companySize,
    leadSource: parsed.leadSource,
    assignedStaffId: parsed.assignedStaffId,
    status: parsed.status,
    tags: parsed.tags,
    customFields: parsed.customFields
  });

  await logCrmAudit(db, {
    id: randomUUID(),
    clientId: input.clientId,
    targetType: 'client',
    targetId: input.clientId,
    actorId: input.actorId,
    action: 'update',
    metadata: { changedFields: Object.keys(parsed) }
  });

  return updated;
}

export interface DeleteClientServiceInput {
  actorId: string;
  clientId: string;
}

export async function removeClient(
  db: AsyncDb,
  input: DeleteClientServiceInput
): Promise<boolean> {
  const existing = await findClientById(db, input.clientId);
  if (!existing) return false;
  await deleteClient(db, input.clientId);
  await logCrmAudit(db, {
    id: randomUUID(),
    clientId: null, // FK is SET NULL on delete
    targetType: 'client',
    targetId: input.clientId,
    actorId: input.actorId,
    action: 'delete',
    metadata: { companyName: existing.companyName }
  });
  return true;
}
