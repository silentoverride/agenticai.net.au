import type { AsyncDb } from '$lib/server/db';
import type { StaffRole } from '$lib/staff-portal/dto';

export interface ListAllReportsInput {
  db: AsyncDb;
  actorId: string;
  role: StaffRole;
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: 'title' | 'customer' | 'status' | 'updated' | 'created';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface AllReportsRow {
  report_id: string;
  session_id: string;
  title: string | null;
  customer_name: string | null;
  customer_email: string | null;
  company: string | null;
  pipeline_status: string | null;
  display_status: string;
  created_at: string;
  updated_at: string | null;
}

export interface AllReportsResult {
  items: AllReportsRow[];
  total: number;
  hasMore: boolean;
}

/**
 * Map raw pipeline status to user-facing display labels.
 */
const DISPLAY_STATUS: Record<string, string> = {
  pending: 'Pending',
  queued: 'Pending',
  pending_payment: 'Pending',
  running_llm: 'In Progress',
  running_tools: 'In Progress',
  running_deck: 'In Progress',
  human_assist: 'In Review',
  completed: 'Closed',
  ready: 'Closed',
  delivered: 'Closed',
  error: 'Resolved',
  retry: 'Pending',
  delayed: 'In Review'
};

export function pipelineToDisplayStatus(raw: string | null): string {
  if (!raw) return 'Pending';
  return DISPLAY_STATUS[raw] ?? raw;
}

export async function listAllReports(input: ListAllReportsInput): Promise<AllReportsResult> {
  const {
    db,
    role,
    search,
    status,
    dateFrom,
    dateTo,
    sort = 'updated',
    order = 'desc',
    limit = 50,
    offset = 0
  } = input;

  const whereClauses: string[] = [];
  const params: unknown[] = [];

  // Role-based filtering: admin sees all; staff sees reports they are involved with
  if (role !== 'admin') {
    whereClauses.push(`EXISTS (
      SELECT 1 FROM staff_action_audit_events sae
      WHERE sae.assessment_id = r.session_id
      AND sae.actor_id = ?
    )`);
    params.push(input.actorId);
  }

  if (search) {
    const term = `%${search}%`;
    whereClauses.push(`(r.title LIKE ? OR r.customer_name LIKE ? OR r.customer_email LIKE ? OR r.company LIKE ?)`);
    params.push(term, term, term, term);
  }

  if (status) {
    whereClauses.push(`ps.status = ?`);
    params.push(status);
  }

  if (dateFrom) {
    whereClauses.push(`date(r.created_at) >= date(?)`);
    params.push(dateFrom);
  }

  if (dateTo) {
    whereClauses.push(`date(r.created_at) <= date(?)`);
    params.push(dateTo);
  }

  const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const orderColumn = sort === 'title' ? 'r.title COLLATE NOCASE'
    : sort === 'customer' ? 'r.customer_name COLLATE NOCASE'
    : sort === 'status' ? 'ps.status'
    : sort === 'created' ? 'r.created_at'
    : 'ps.updated_at';

  const orderDir = order === 'asc' ? 'ASC' : 'DESC';
  const safeLimit = Math.min(limit, 200);
  const safeOffset = Math.max(offset, 0);

  // Count query
  const countRow = await db.queryOne<{ total: number }>(
    `SELECT COUNT(*) as total
     FROM reports r
     LEFT JOIN pipeline_status ps ON r.session_id = ps.session_id
     ${where}`,
    ...params
  );
  const total = countRow?.total ?? 0;

  // Data query — fetch one extra to detect hasMore
  const rows = await db.queryAll<AllReportsRow>(
    `SELECT
       r.id as report_id,
       r.session_id,
       r.title,
       r.customer_name,
       r.customer_email,
       r.company,
       ps.status as pipeline_status,
       r.created_at,
       ps.updated_at
     FROM reports r
     LEFT JOIN pipeline_status ps ON r.session_id = ps.session_id
     ${where}
     ORDER BY ${orderColumn} ${orderDir}
     LIMIT ? OFFSET ?`,
    ...params,
    safeLimit + 1,
    safeOffset
  );

  const hasMore = rows.length > safeLimit;
  if (hasMore) rows.pop();

  // Enrich with display status
  const items = rows.map(row => ({
    ...row,
    display_status: pipelineToDisplayStatus(row.pipeline_status)
  }));

  return {
    items,
    total,
    hasMore
  };
}
