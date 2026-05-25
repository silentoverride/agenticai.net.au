import type { AsyncDb } from '$lib/server/db';
import type { StaffMeetingBriefDto, MeetingBriefState } from '$lib/staff-portal/dto';

// ---------------------------------------------------------------------------
// Row type
// ---------------------------------------------------------------------------

interface MeetingBriefRow {
  id: string;
  assessment_id: string;
  meeting_date: string | null;
  objective: string | null;
  talking_points: string | null;
  sensitive_issues: string | null;
  offer_next_step: string | null;
  follow_up_intention: string | null;
  final_agenda_notes: string | null;
  prep_checklist: string | null;
  status: string;
  linked_report_id: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface CreateMeetingBriefInput {
  assessmentId: string;
  meetingDate?: string | null;
  objective?: string | null;
  talkingPoints?: string | null;
  sensitiveIssues?: string | null;
  offerNextStep?: string | null;
  followUpIntention?: string | null;
  finalAgendaNotes?: string | null;
  prepChecklist?: string | null;
  linkedReportId?: string | null;
}

export interface UpdateMeetingBriefInput {
  id: string;
  meetingDate?: string | null;
  objective?: string | null;
  talkingPoints?: string | null;
  sensitiveIssues?: string | null;
  offerNextStep?: string | null;
  followUpIntention?: string | null;
  finalAgendaNotes?: string | null;
  prepChecklist?: string | null;
  status?: MeetingBriefState;
  linkedReportId?: string | null;
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function findMeetingBriefByAssessment(
  db: AsyncDb,
  assessmentId: string
): Promise<StaffMeetingBriefDto | null> {
  const row = await db.queryOne<MeetingBriefRow>(
    'SELECT * FROM meeting_briefs WHERE assessment_id = ? ORDER BY created_at DESC LIMIT 1',
    assessmentId
  );
  return row ? mapMeetingBriefRow(row) : null;
}

export async function findMeetingBriefById(
  db: AsyncDb,
  id: string
): Promise<StaffMeetingBriefDto | null> {
  const row = await db.queryOne<MeetingBriefRow>(
    'SELECT * FROM meeting_briefs WHERE id = ?',
    id
  );
  return row ? mapMeetingBriefRow(row) : null;
}

export async function insertMeetingBrief(
  db: AsyncDb,
  input: CreateMeetingBriefInput & { id: string; status: MeetingBriefState }
): Promise<StaffMeetingBriefDto> {
  await db.exec(
    `INSERT INTO meeting_briefs (
      id, assessment_id, meeting_date, objective, talking_points,
      sensitive_issues, offer_next_step, follow_up_intention,
      final_agenda_notes, prep_checklist, status, linked_report_id,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    input.id,
    input.assessmentId,
    input.meetingDate ?? null,
    input.objective ?? null,
    input.talkingPoints ?? null,
    input.sensitiveIssues ?? null,
    input.offerNextStep ?? null,
    input.followUpIntention ?? null,
    input.finalAgendaNotes ?? null,
    input.prepChecklist ?? null,
    input.status,
    input.linkedReportId ?? null
  );

  const row = await db.queryOne<MeetingBriefRow>(
    'SELECT * FROM meeting_briefs WHERE id = ?',
    input.id
  );
  if (!row) throw new Error('Inserted meeting brief was not found');
  return mapMeetingBriefRow(row);
}

export async function updateMeetingBrief(
  db: AsyncDb,
  input: UpdateMeetingBriefInput
): Promise<StaffMeetingBriefDto | null> {
  const setClauses: string[] = ['updated_at = datetime(\'now\')'];
  const params: unknown[] = [];

  const fields: [string, unknown | undefined][] = [
    ['meeting_date', input.meetingDate],
    ['objective', input.objective],
    ['talking_points', input.talkingPoints],
    ['sensitive_issues', input.sensitiveIssues],
    ['offer_next_step', input.offerNextStep],
    ['follow_up_intention', input.followUpIntention],
    ['final_agenda_notes', input.finalAgendaNotes],
    ['prep_checklist', input.prepChecklist],
    ['status', input.status],
    ['linked_report_id', input.linkedReportId]
  ];

  for (const [column, value] of fields) {
    if (value !== undefined) {
      setClauses.push(`${column} = ?`);
      params.push(value);
    }
  }

  params.push(input.id);

  await db.exec(
    `UPDATE meeting_briefs SET ${setClauses.join(', ')} WHERE id = ?`,
    ...params
  );

  const row = await db.queryOne<MeetingBriefRow>(
    'SELECT * FROM meeting_briefs WHERE id = ?',
    input.id
  );
  return row ? mapMeetingBriefRow(row) : null;
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

function mapMeetingBriefRow(row: MeetingBriefRow): StaffMeetingBriefDto {
  return {
    id: row.id,
    assessmentId: row.assessment_id,
    meetingDate: row.meeting_date,
    objective: row.objective,
    talkingPoints: row.talking_points,
    sensitiveIssues: row.sensitive_issues,
    offerNextStep: row.offer_next_step,
    followUpIntention: row.follow_up_intention,
    finalAgendaNotes: row.final_agenda_notes,
    prepChecklist: row.prep_checklist,
    status: row.status as MeetingBriefState,
    linkedReportId: row.linked_report_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
