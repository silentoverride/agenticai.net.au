/**
 * Clients repository — DB layer for the `clients` table.
 *
 * Module: Epic 11 — Clients CRM (post-MVP track).
 * Mirrors the pattern of src/lib/server/staff-portal/repositories/*.repository.ts.
 */

import type { AsyncDb } from '$lib/server/db';
import type {
  ClientDto,
  ClientListFilters,
  ClientListItemDto,
  ClientListResultDto,
  ClientStatus
} from '$lib/staff-portal/clients.dto';

// ---------------------------------------------------------------------------
// Row type (matches the D1 schema exactly)
// ---------------------------------------------------------------------------

interface ClientRow {
  id: string;
  clerk_user_id: string | null;
  company_name: string;
  trading_name: string | null;
  primary_contact_name: string | null;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  secondary_phone: string | null;
  website: string | null;
  billing_address: string | null;
  shipping_address: string | null;
  tax_id: string | null;
  industry: string | null;
  company_size: string | null;
  lead_source: string | null;
  assigned_staff_id: string | null;
  status: string;
  tags: string; // JSON
  custom_fields: string; // JSON
  created_at: string;
  updated_at: string;
}

function mapRow(row: ClientRow): ClientDto {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    companyName: row.company_name,
    tradingName: row.trading_name,
    primaryContactName: row.primary_contact_name,
    jobTitle: row.job_title,
    email: row.email,
    phone: row.phone,
    secondaryPhone: row.secondary_phone,
    website: row.website,
    billingAddress: row.billing_address,
    shippingAddress: row.shipping_address,
    taxId: row.tax_id,
    industry: row.industry,
    companySize: row.company_size,
    leadSource: row.lead_source,
    assignedStaffId: row.assigned_staff_id,
    status: (row.status as ClientStatus) ?? 'active',
    tags: safeJsonArray(row.tags),
    customFields: safeJsonObject(row.custom_fields),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
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

function safeJsonObject(value: string | null | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Single-row reads
// ---------------------------------------------------------------------------

export async function findClientById(
  db: AsyncDb,
  id: string
): Promise<ClientDto | null> {
  const row = await db.queryOne<ClientRow>('SELECT * FROM clients WHERE id = ?', id);
  return row ? mapRow(row) : null;
}

export async function findClientByClerkUser(
  db: AsyncDb,
  clerkUserId: string
): Promise<ClientDto | null> {
  const row = await db.queryOne<ClientRow>(
    'SELECT * FROM clients WHERE clerk_user_id = ? ORDER BY created_at DESC LIMIT 1',
    clerkUserId
  );
  return row ? mapRow(row) : null;
}

// ---------------------------------------------------------------------------
// List with filters, sort, pagination
// ---------------------------------------------------------------------------

interface ListRow {
  id: string;
  company_name: string;
  primary_contact_name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  tags: string;
  assigned_staff_id: string | null;
  created_at: string;
  last_interaction_at: string | null;
  open_task_count: number;
}

export async function listClients(
  db: AsyncDb,
  filters: ClientListFilters
): Promise<ClientListResultDto> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 25));
  const offset = (page - 1) * pageSize;
  const sortBy = filters.sortBy ?? 'companyName';
  const sortDir = filters.sortDir ?? 'asc';

  const where: string[] = [];
  const params: unknown[] = [];

  if (filters.status) {
    where.push('c.status = ?');
    params.push(filters.status);
  }
  if (filters.assignedStaffId) {
    where.push('c.assigned_staff_id = ?');
    params.push(filters.assignedStaffId);
  }
  if (filters.search) {
    const term = `%${filters.search.toLowerCase()}%`;
    where.push(
      '(LOWER(c.company_name) LIKE ? OR LOWER(COALESCE(c.primary_contact_name, "")) LIKE ? OR LOWER(COALESCE(c.email, "")) LIKE ? OR LOWER(COALESCE(c.phone, "")) LIKE ? OR LOWER(c.tags) LIKE ?)'
    );
    params.push(term, term, term, term, term);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const sortColumn = (() => {
    switch (sortBy) {
      case 'status': return 'c.status';
      case 'createdAt': return 'c.created_at';
      case 'lastInteraction': return 'last_interaction_at';
      default: return 'c.company_name';
    }
  })();
  const sortDirection = sortDir === 'desc' ? 'DESC' : 'ASC';

  // Total count
  const countRow = await db.queryOne<{ total: number }>(
    `SELECT COUNT(*) AS total FROM clients c ${whereClause}`,
    ...params
  );
  const total = countRow?.total ?? 0;

  // Page (with last_interaction_at and open_task_count subqueries)
  const sql = `
    SELECT
      c.id, c.company_name, c.primary_contact_name, c.email, c.phone,
      c.status, c.tags, c.assigned_staff_id, c.created_at,
      (SELECT MAX(occurred_at) FROM client_interactions WHERE client_id = c.id) AS last_interaction_at,
      (SELECT COUNT(*) FROM client_tasks WHERE client_id = c.id AND status IN ('open','in_progress')) AS open_task_count
    FROM clients c
    ${whereClause}
    ORDER BY ${sortColumn} ${sortDirection}
    LIMIT ? OFFSET ?
  `;
  const rows = await db.queryAll<ListRow>(sql, ...params, pageSize, offset);

  const items: ClientListItemDto[] = rows.map((r) => ({
    id: r.id,
    companyName: r.company_name,
    primaryContactName: r.primary_contact_name,
    email: r.email,
    phone: r.phone,
    status: (r.status as ClientStatus) ?? 'active',
    tags: safeJsonArray(r.tags),
    assignedStaffId: r.assigned_staff_id,
    lastInteractionAt: r.last_interaction_at,
    openTaskCount: r.open_task_count,
    createdAt: r.created_at
  }));

  return { items, total, page, pageSize };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export interface CreateClientRow {
  id: string;
  companyName: string;
  tradingName?: string | null;
  primaryContactName?: string | null;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  secondaryPhone?: string | null;
  website?: string | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  taxId?: string | null;
  industry?: string | null;
  companySize?: string | null;
  leadSource?: string | null;
  assignedStaffId?: string | null;
  status?: ClientStatus;
  tags?: string[];
  customFields?: Record<string, unknown>;
  clerkUserId?: string | null;
}

export async function insertClient(
  db: AsyncDb,
  input: CreateClientRow
): Promise<ClientDto> {
  const now = new Date().toISOString();
  await db.exec(
    `INSERT INTO clients (
      id, clerk_user_id, company_name, trading_name, primary_contact_name,
      job_title, email, phone, secondary_phone, website, billing_address,
      shipping_address, tax_id, industry, company_size, lead_source,
      assigned_staff_id, status, tags, custom_fields, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.id,
    input.clerkUserId ?? null,
    input.companyName,
    input.tradingName ?? null,
    input.primaryContactName ?? null,
    input.jobTitle ?? null,
    input.email ?? null,
    input.phone ?? null,
    input.secondaryPhone ?? null,
    input.website ?? null,
    input.billingAddress ?? null,
    input.shippingAddress ?? null,
    input.taxId ?? null,
    input.industry ?? null,
    input.companySize ?? null,
    input.leadSource ?? null,
    input.assignedStaffId ?? null,
    input.status ?? 'active',
    JSON.stringify(input.tags ?? []),
    JSON.stringify(input.customFields ?? {}),
    now,
    now
  );
  const created = await findClientById(db, input.id);
  if (!created) throw new Error('insertClient: client not found after insert');
  return created;
}

export interface UpdateClientRow {
  companyName?: string;
  tradingName?: string | null;
  primaryContactName?: string | null;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  secondaryPhone?: string | null;
  website?: string | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  taxId?: string | null;
  industry?: string | null;
  companySize?: string | null;
  leadSource?: string | null;
  assignedStaffId?: string | null;
  status?: ClientStatus;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

export async function updateClient(
  db: AsyncDb,
  id: string,
  patch: UpdateClientRow
): Promise<ClientDto | null> {
  const sets: string[] = [];
  const params: unknown[] = [];

  const map: Record<string, unknown> = {
    company_name: patch.companyName,
    trading_name: patch.tradingName,
    primary_contact_name: patch.primaryContactName,
    job_title: patch.jobTitle,
    email: patch.email,
    phone: patch.phone,
    secondary_phone: patch.secondaryPhone,
    website: patch.website,
    billing_address: patch.billingAddress,
    shipping_address: patch.shippingAddress,
    tax_id: patch.taxId,
    industry: patch.industry,
    company_size: patch.companySize,
    lead_source: patch.leadSource,
    assigned_staff_id: patch.assignedStaffId,
    status: patch.status
  };
  for (const [col, val] of Object.entries(map)) {
    if (val !== undefined) {
      sets.push(`${col} = ?`);
      params.push(val);
    }
  }
  if (patch.tags !== undefined) {
    sets.push('tags = ?');
    params.push(JSON.stringify(patch.tags));
  }
  if (patch.customFields !== undefined) {
    sets.push('custom_fields = ?');
    params.push(JSON.stringify(patch.customFields));
  }
  if (sets.length === 0) return findClientById(db, id);

  sets.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(id);

  await db.exec(
    `UPDATE clients SET ${sets.join(', ')} WHERE id = ?`,
    ...params
  );
  return findClientById(db, id);
}

export async function deleteClient(db: AsyncDb, id: string): Promise<boolean> {
  // CASCADE on FKs removes client_files / client_interactions / client_tasks
  await db.exec('DELETE FROM clients WHERE id = ?', id);
  return true;
}
