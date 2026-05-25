import type { AsyncDb } from '$lib/server/db';
import type {
  StaffFollowUpDto,
  FollowUpStatus,
  FollowUpSource,
  CreateFollowUpInput
} from '$lib/staff-portal/dto';

// ---------------------------------------------------------------------------
// Row type
// ---------------------------------------------------------------------------

interface FollowUpRow {
  id: string;
  assessment_id: string;
  title: string;
  description: string | null;
  owner_id: string | null;
  due_date: string | null;
  source: string;
  status: string;
  client_visible_promise: number;
  consequence_of_inaction: string | null;
  notes: string | null;
  linked_report_id: string | null;
  linked_gate_finding_id: string | null;
  linked_meeting_brief_id: string | null;
  linked_commercial_step_id: string | null;
  support_issue_ref: string | null;
  admin_task_ref: string | null;
  delayed_journey_state: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function insertFollowUp(
  db: AsyncDb,
  input: CreateFollowUpInput & { id: string }
): Promise<StaffFollowUpDto> {
  await db.exec(
    `INSERT INTO follow_ups (
      id, assessment_id, title, description, owner_id, due_date, source,
      status, client_visible_promise, consequence_of_inaction, notes,
      linked_report_id, linked_gate_finding_id, linked_meeting_brief_id,
      linked_commercial_step_id, support_issue_ref, admin_task_ref,
      delayed_journey_state, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    input.id,
    input.assessmentId,
    input.title,
    input.description ?? null,
    input.ownerId ?? null,
    input.dueDate ?? null,
    input.source,
    'open',
    input.clientVisiblePromise ? 1 : 0,
    input.consequenceOfInaction ?? null,
    input.notes ?? null,
    input.linkedReportId ?? null,
    input.linkedGateFindingId ?? null,
    input.linkedMeetingBriefId ?? null,
    input.linkedCommercialStepId ?? null,
    input.supportIssueRef ?? null,
    input.adminTaskRef ?? null,
    input.delayedJourneyState ?? null
  );

  const row = await db.queryOne<FollowUpRow>(
    'SELECT * FROM follow_ups WHERE id = ?',
    input.id
  );
  if (!row) throw new Error('Inserted follow-up was not found');
  return mapFollowUpRow(row);
}

export async function updateFollowUpStatus(
  db: AsyncDb,
  input: { id: string; status: FollowUpStatus; notes?: string | null; ownerId?: string | null }
): Promise<StaffFollowUpDto | null> {
  const setClauses: string[] = ['status = ?', 'updated_at = datetime(\'now\')'];
  const params: unknown[] = [input.status];

  if (input.notes !== undefined) {
    setClauses.push('notes = ?');
    params.push(input.notes);
  }
  if (input.ownerId !== undefined) {
    setClauses.push('owner_id = ?');
    params.push(input.ownerId);
  }

  params.push(input.id);

  await db.exec(
    `UPDATE follow_ups SET ${setClauses.join(', ')} WHERE id = ?`,
    ...params
  );

  const row = await db.queryOne<FollowUpRow>(
    'SELECT * FROM follow_ups WHERE id = ?',
    input.id
  );
  return row ? mapFollowUpRow(row) : null;
}

export async function findFollowUpById(
  db: AsyncDb,
  id: string
): Promise<StaffFollowUpDto | null> {
  const row = await db.queryOne<FollowUpRow>(
    'SELECT * FROM follow_ups WHERE id = ?',
    id
  );
  return row ? mapFollowUpRow(row) : null;
}

export async function findFollowUpsByAssessment(
  db: AsyncDb,
  assessmentId: string,
  limit = 50
): Promise<StaffFollowUpDto[]> {
  const rows = await db.queryAll<FollowUpRow>(
    `SELECT * FROM follow_ups
     WHERE assessment_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    assessmentId,
    limit
  );
  return rows.map(mapFollowUpRow);
}

export async function findFollowUpsByOwner(
  db: AsyncDb,
  ownerId: string,
  status?: FollowUpStatus,
  limit = 50
): Promise<StaffFollowUpDto[]> {
  let sql = 'SELECT * FROM follow_ups WHERE owner_id = ?';
  const params: unknown[] = [ownerId];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  const rows = await db.queryAll<FollowUpRow>(sql, ...params);
  return rows.map(mapFollowUpRow);
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

function mapFollowUpRow(row: FollowUpRow): StaffFollowUpDto {
  return {
    id: row.id,
    assessmentId: row.assessment_id,
    title: row.title,
    description: row.description,
    ownerId: row.owner_id,
    dueDate: row.due_date,
    source: row.source as FollowUpSource,
    status: row.status as FollowUpStatus,
    clientVisiblePromise: row.client_visible_promise === 1,
    consequenceOfInaction: row.consequence_of_inaction,
    notes: row.notes,
    linkedReportId: row.linked_report_id,
    linkedGateFindingId: row.linked_gate_finding_id,
    linkedMeetingBriefId: row.linked_meeting_brief_id,
    linkedCommercialStepId: row.linked_commercial_step_id,
    supportIssueRef: row.support_issue_ref,
    adminTaskRef: row.admin_task_ref,
    delayedJourneyState: row.delayed_journey_state,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
