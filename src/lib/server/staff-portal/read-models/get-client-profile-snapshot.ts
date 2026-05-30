import type { AsyncDb } from '$lib/server/db';
import type {
  StaffClientProfileSnapshotDto,
  StaffClientProfileResultDto,
  StaffRole,
  ErrorCode,
  CommercialNextStepStatus,
  FollowUpState,
  MeetingBriefState,
  HumanReviewState
} from '$lib/staff-portal/dto';
import {
  HUMAN_REVIEW_STATES
} from '../domain/states';
import { mapBrownfieldReportState } from '../mappers/brownfield-report-state';

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface GetClientProfileSnapshotInput {
  db: AsyncDb;
  clientId: string;
  actorId: string;
  role: StaffRole;
}

// ---------------------------------------------------------------------------
// Row types from the bounded D1 query
// ---------------------------------------------------------------------------

interface ProfileBaseRow {
  session_id: string;
  customer_name: string | null;
  company: string | null;
  journey_stage: string | null;
  risk_flags: string | null;
  value_flags: string | null;
  pipeline_status: string | null;
  review_status: string | null;
  review_operator_id: string | null;
  artifact_r2_key: string | null;
  deck_url: string | null;
  blocking_count: number;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Read model
// ---------------------------------------------------------------------------

export async function getClientProfileSnapshot(
  input: GetClientProfileSnapshotInput
): Promise<StaffClientProfileResultDto> {
  const { db, clientId, actorId, role } = input;

  // Bounded single-row query — loads the assessment session data for this client
  const base = await db.queryOne<ProfileBaseRow>(
    `SELECT
      ps.session_id,
      ao.customer_name,
      ao.company,
      ao.journey_stage,
      ao.risk_flags,
      ao.value_flags,
      ps.status AS pipeline_status,
      har.status AS review_status,
      har.operator_id AS review_operator_id,
      r.r2_key AS artifact_r2_key,
      r.deck_url,
      (SELECT COUNT(*) FROM assessment_gates ag
       WHERE ag.assessment_id = ps.session_id
         AND ag.verdict IN ('block', 'retry', 'escalate', 'human_assist')) AS blocking_count,
      ps.created_at,
      ps.updated_at
    FROM pipeline_status ps
    LEFT JOIN assessment_orders ao ON ao.session_id = ps.session_id
    LEFT JOIN human_assist_reviews har ON har.assessment_id = ps.session_id
    LEFT JOIN reports r ON r.session_id = ps.session_id
    WHERE ps.session_id = ?
    LIMIT 1`,
    clientId
  );

  if (!base) {
    return {
      profile: null,
      hasData: false,
      degradedFields: [],
      errorCode: 'not_found'
    };
  }

  // Permission check: staffers can only see their assigned or shared-queue items
  if (role === 'staff' && base.review_operator_id && base.review_operator_id !== actorId) {
    return {
      profile: null,
      hasData: false,
      degradedFields: [],
      errorCode: 'permission_denied'
    };
  }

  // Build governed report state via brownfield mappers
  const governedState = mapBrownfieldReportState({
    pipelineStatus: base.pipeline_status,
    humanAssistStatus: base.review_status,
    artifactPresent: Boolean(base.artifact_r2_key || base.deck_url),
    approvalEvidence: false,
    unresolvedBlockingFindings: base.blocking_count
  });

  // Derive human review state from the human_assist_reviews status
  const humanReviewState = mapReviewStatus(base.review_status);

  // Track degraded fields
  const degradedFields: string[] = [];
  if (!base.customer_name && !base.company) degradedFields.push('businessName');
  if (!base.artifact_r2_key && !base.deck_url) degradedFields.push('reportArtifact');

  // Parse risk/value flags from JSON string or comma-separated
  const riskFlags = parseFlags(base.risk_flags);
  const valueFlags = parseFlags(base.value_flags);

  // Follow-up and Meeting Brief are not available in MVP until epics 4.
  const notAvailableMeetingBrief: MeetingBriefState = 'not_available';
  const notAvailableFollowUp: FollowUpState = 'not_available';

  // Read commercial next step from database
  let commercialNextStepStatus: CommercialNextStepStatus = 'not_available';
  try {
    const commercialRow = await db.queryOne<{ status: string }>(
      'SELECT status FROM commercial_next_steps WHERE assessment_id = ? ORDER BY created_at DESC LIMIT 1',
      base.session_id
    );
    if (commercialRow) {
      commercialNextStepStatus = commercialRow.status as CommercialNextStepStatus;
    }
  } catch {
    // Table may not exist yet — default to not_available
  }

  const profile: StaffClientProfileSnapshotDto = {
    clientId: base.session_id,
    businessName: base.customer_name ?? base.company ?? 'Unknown Business',
    ownerName: base.review_operator_id ?? '',
    journeyStage: base.journey_stage ?? governedState.state,
    riskFlags,
    valueFlags,
    reportState: governedState.state,
    humanReviewState,
    meetingBriefState: notAvailableMeetingBrief,
    followUpState: notAvailableFollowUp,
    commercialNextStepStatus
  };

  const errorCode: ErrorCode | null = degradedFields.length > 0 ? 'degraded' : null;

  return {
    profile,
    hasData: true,
    degradedFields,
    errorCode
  };
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

/**
 * Parse flags from a JSON array string or comma-separated string.
 * Returns an empty array if the value is null, empty, or unparseable.
 */
function parseFlags(value: string | null | undefined): string[] {
  if (!value) return [];

  const trimmed = value.trim();

  // Try JSON array format
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed.filter((f): f is string => typeof f === 'string') : [];
    } catch {
      return [];
    }
  }

  // Comma-separated fallback
  return trimmed.split(',').map((f) => f.trim()).filter(Boolean);
}
