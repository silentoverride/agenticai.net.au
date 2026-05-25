import type { AsyncDb } from '$lib/server/db';
import type { StaffLinkedGateFindingDto } from '$lib/staff-portal/dto';
import { mapGateFindingState } from '../mappers/gate-finding-state';

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface GetLinkedGateFindingsInput {
  db: AsyncDb;
  assessmentId: string;
  /** Include recently resolved findings (within N days). Default: 7 */
  recentResolvedDays?: number;
}

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

interface GateFindingRow {
  gate_run_id: string;
  assessment_id: string;
  gate_type: string;
  verdict: string;
  confidence: number | null;
  reasoning: string | null;
  details: string | null;
  created_at: string;
  review_status: string | null;
  review_notes: string | null;
  review_decision: string | null;
  review_edited_content: string | null;
}

// ---------------------------------------------------------------------------
// Blocking verdict set
// ---------------------------------------------------------------------------

const BLOCKING_VERDICTS = new Set(['block', 'retry', 'escalate', 'human_assist']);

// ---------------------------------------------------------------------------
// Read model
// ---------------------------------------------------------------------------

export async function getLinkedGateFindings(
  input: GetLinkedGateFindingsInput
): Promise<StaffLinkedGateFindingDto[]> {
  const { db, assessmentId, recentResolvedDays = 7 } = input;

  // Query gate findings linked to this assessment
  // Include: all unresolved findings + recently resolved ones
  const rows = await db.queryAll<GateFindingRow>(
    `SELECT
      ag.gate_run_id,
      ag.assessment_id,
      ag.gate_type,
      ag.verdict,
      ag.confidence,
      ag.reasoning,
      ag.details,
      ag.created_at,
      har.status AS review_status,
      har.operator_notes AS review_notes,
      har.status AS review_decision,
      har.edited_content AS review_edited_content
    FROM assessment_gates ag
    LEFT JOIN human_assist_reviews har
      ON har.assessment_id = ag.assessment_id
     AND har.gate_run_id = ag.gate_run_id
    WHERE ag.assessment_id = ?
      AND (
        -- Unresolved: no approval evidence, or still open/in-review
        (COALESCE(har.status, '') NOT IN ('approved', 'rejected'))
        OR
        -- Recently resolved: approved/rejected within the lookback window
        (
          har.status IN ('approved', 'rejected')
          AND har.reviewed_at IS NOT NULL
          AND datetime(har.reviewed_at) >= datetime('now', ?)
        )
      )
    ORDER BY ag.created_at DESC
    LIMIT 50`,
    assessmentId,
    `-${recentResolvedDays} days`
  );

  return rows.map((row) => toLinkedGateFindingDto(row));
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

function toLinkedGateFindingDto(row: GateFindingRow): StaffLinkedGateFindingDto {
  const isBlocking = BLOCKING_VERDICTS.has((row.verdict ?? '').trim().toLowerCase());

  const governedState = mapGateFindingState({
    gateVerdict: row.verdict,
    humanAssistStatus: row.review_status,
    approvalEvidence: row.review_status === 'approved',
    overrideReason: row.review_edited_content
  });

  // Additional fields that may not be present in all assessment_gates rows
  const rowAny = row as unknown as Record<string, unknown>;
  const flaggedSection = (rowAny.flagged_section as string | undefined) ?? null;
  const relatedIntakeEvidence = (rowAny.related_intake_evidence as string | undefined) ?? null;
  const inspectionSteps = (rowAny.inspection_steps as string | undefined) ?? null;
  const severity = (rowAny.severity as string | undefined) ?? null;

  return {
    findingId: row.gate_run_id,
    type: row.gate_type,
    verdict: row.verdict,
    confidence: row.confidence,
    severity,
    reasoning: row.reasoning,
    details: row.details,
    flaggedSection,
    relatedIntakeEvidence,
    suggestedInspectionSteps: inspectionSteps,
    decisionState: governedState.state,
    linkedReportId: row.assessment_id,
    isBlocking
  };
}
