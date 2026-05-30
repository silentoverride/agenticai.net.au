import type { AsyncDb } from '$lib/server/db';
import type {
  HumanReviewState,
  StaffLinkedReportDto
} from '$lib/staff-portal/dto';
import {
  HUMAN_REVIEW_STATES
} from '../domain/states';
import { mapBrownfieldReportState } from '../mappers/brownfield-report-state';

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface GetLinkedReportContextInput {
  db: AsyncDb;
  assessmentId: string;
}

// ---------------------------------------------------------------------------
// Row types from bounded D1 queries
// ---------------------------------------------------------------------------

interface ReportRow {
  id: string;
  session_id: string;
  r2_key: string | null;
  deck_url: string | null;
  title: string | null;
  created_at: string;
}

interface PipelineRow {
  session_id: string;
  status: string | null;
  deck_url: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

interface HumanAssistRow {
  assessment_id: string;
  status: string | null;
  operator_id: string | null;
  operator_notes: string | null;
  gate_run_id: string | null;
  reviewed_at: string | null;
}

// ---------------------------------------------------------------------------
// Read model
// ---------------------------------------------------------------------------

export async function getLinkedReportContext(
  input: GetLinkedReportContextInput
): Promise<StaffLinkedReportDto[]> {
  const { db, assessmentId } = input;

  // Load pipeline status — bounded single-row query
  const pipeline = await db.queryOne<PipelineRow>(
    `SELECT session_id, status, deck_url, error, created_at, updated_at
     FROM pipeline_status
     WHERE session_id = ?
     LIMIT 1`,
    assessmentId
  );

  if (!pipeline) {
    return [];
  }

  // Load human assist review — bounded single-row query
  const har = await db.queryOne<HumanAssistRow>(
    `SELECT assessment_id, status, operator_id, operator_notes, gate_run_id, reviewed_at
     FROM human_assist_reviews
     WHERE assessment_id = ?
     LIMIT 1`,
    assessmentId
  );

  // Load reports from the reports table — bounded query (max 20)
  const reportRows = await db.queryAll<ReportRow>(
    `SELECT id, session_id, r2_key, deck_url, title, created_at
     FROM reports
     WHERE session_id = ?
     ORDER BY created_at DESC
     LIMIT 20`,
    assessmentId
  );

  // If there are no explicit report rows, create one derived from pipeline data
  const reports: ReportRow[] = reportRows.length > 0
    ? reportRows
    : pipeline
      ? [{
          id: pipeline.session_id,
          session_id: pipeline.session_id,
          r2_key: null,
          deck_url: pipeline.deck_url,
          title: null,
          created_at: pipeline.created_at
        }]
      : [];

  // Count blocking findings for this assessment
  const blockingCountRow = await db.queryOne<{ count: number }>(
    `SELECT COUNT(*) AS count FROM assessment_gates
     WHERE assessment_id = ?
       AND verdict IN ('block', 'retry', 'escalate', 'human_assist')`,
    assessmentId
  );
  const blockingCount = blockingCountRow?.count ?? 0;

  // Assess conflict by checking for contradictory pipeline/review records
  const hasConflict = await detectConflict(db, assessmentId);

  return reports.map((row) => {
    const artifactPresent = Boolean(row.r2_key || row.deck_url);
    const degradedFields: string[] = [];

    if (!artifactPresent) degradedFields.push('artifacts');
    if (hasConflict) degradedFields.push('state');

    const governedState = mapBrownfieldReportState({
      pipelineStatus: pipeline?.status,
      humanAssistStatus: har?.status,
      artifactPresent,
      approvalEvidence: false,
      unresolvedBlockingFindings: blockingCount,
      conflict: hasConflict
    });

    // Derive human review state
    const humanReviewState = mapReviewStatus(har?.status);

    // Build artifact version label
    const artifactVersion = row.r2_key
      ? row.r2_key.split('/').pop() ?? row.r2_key
      : row.deck_url
        ? `deck-${row.id.slice(0, 8)}`
        : null;

    // Build review workspace route
    const reviewWorkspaceRoute = `/staff/assessments/${assessmentId}/review`;

    return {
      reportId: row.id,
      title: row.title ?? `Report (${row.id.slice(0, 8)})`,
      reportState: governedState.state,
      humanReviewState,
      artifactVersion,
      createdAt: row.created_at,
      hasArtifacts: artifactPresent,
      degradedFields,
      reviewWorkspaceRoute
    };
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapReviewStatus(value: string | null | undefined): HumanReviewState {
  switch ((value ?? '').trim().toLowerCase()) {
    case 'pending': return HUMAN_REVIEW_STATES.PENDING;
    case 'in_review': return HUMAN_REVIEW_STATES.IN_REVIEW;
    case 'approved': return HUMAN_REVIEW_STATES.APPROVED;
    case 'rejected': return HUMAN_REVIEW_STATES.REJECTED;
    case 'edited': return HUMAN_REVIEW_STATES.EDITED;
    default: return HUMAN_REVIEW_STATES.NONE;
  }
}

async function detectConflict(db: AsyncDb, assessmentId: string): Promise<boolean> {
  // Check for conflicting pipeline status vs review status
  const conflicting = await db.queryOne<{ conflict: number }>(
    `SELECT COUNT(*) AS conflict
     FROM pipeline_status ps
     INNER JOIN human_assist_reviews har ON har.assessment_id = ps.session_id
     WHERE ps.session_id = ?
       AND ((ps.status IN ('failed', 'error') AND har.status = 'approved')
         OR (ps.status IN ('ready', 'completed') AND har.status IS NULL AND
             (SELECT COUNT(*) FROM human_assist_reviews WHERE assessment_id = ?) > 0))
     LIMIT 1`,
    assessmentId, assessmentId
  );
  return (conflicting?.conflict ?? 0) > 0;
}
