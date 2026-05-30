import type { AsyncDb } from '$lib/server/db';
import type {
  ReportState,
  HumanReviewState,
  StaffActionDescriptor,
  StaffReportReviewQueueItemDto
} from '$lib/staff-portal/dto';
import {
  HUMAN_REVIEW_STATES,
  REPORT_STATES,
  RISK_SIGNALS,
  type GovernedReportState
} from '../domain/states';
import { mapBrownfieldReportState } from '../mappers/brownfield-report-state';
import { getAvailableActions } from '../services/get-available-actions';

export interface ListReportReviewQueueInput {
  db: AsyncDb;
  actorId: string;
  role: 'staff' | 'admin';
  limit?: number;
  offset?: number;
}

export interface ListReportReviewQueueResult {
  items: StaffReportReviewQueueItemDto[];
  total: number;
  hasMore: boolean;
}

// ---------------------------------------------------------------------------
// Row types from the bounded D1 query
// ---------------------------------------------------------------------------

interface QueueQueryRow {
  session_id: string;
  customer_name: string | null;
  company: string | null;
  pipeline_status: string | null;
  review_status: string | null;
  review_operator_id: string | null;
  latest_gate_verdict: string | null;
  latest_gate_reasoning: string | null;
  artifact_r2_key: string | null;
  deck_url: string | null;
  blocking_count: number;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
}

interface CountRow {
  total: number;
}

// ---------------------------------------------------------------------------
// Read model
// ---------------------------------------------------------------------------

export async function listReportReviewQueue(
  input: ListReportReviewQueueInput
): Promise<ListReportReviewQueueResult> {
  const limit = Math.min(input.limit ?? 50, 100);
  const offset = input.offset ?? 0;

  // Role-based filtering: admin sees all work; staffer sees only what they
  // are assigned to or unassigned items (shared queue)
  const roleFilter = input.role === 'admin'
    ? '' // no filter — admin sees all
    : 'AND (har.operator_id IS NULL OR har.operator_id = ?)';

  // Bind params: for staffer, actorId is the operator_id filter; for admin, skip it
  const filterParams: unknown[] = input.role === 'staff' ? [input.actorId] : [];

  const countSql = `
    SELECT COUNT(*) AS total FROM (
      SELECT ps.session_id
      FROM pipeline_status ps
      LEFT JOIN human_assist_reviews har ON har.assessment_id = ps.session_id
      WHERE ps.status IS NOT NULL
        AND (ps.status IN ('human_assist', 'ready', 'completed', 'delayed', 'failed', 'error')
          OR har.status IS NOT NULL)
        ${roleFilter}
      GROUP BY ps.session_id
    ) sub
  `;

  const countRow = await input.db.queryOne<CountRow>(countSql, ...filterParams);
  const total = countRow?.total ?? 0;

  const dataSql = `
    SELECT
      ps.session_id,
      ao.customer_name,
      ao.company,
      ps.status AS pipeline_status,
      har.status AS review_status,
      har.operator_id AS review_operator_id,
      (SELECT ag.verdict FROM assessment_gates ag
       WHERE ag.assessment_id = ps.session_id
       ORDER BY ag.created_at DESC LIMIT 1) AS latest_gate_verdict,
      (SELECT ag.reasoning FROM assessment_gates ag
       WHERE ag.assessment_id = ps.session_id
       ORDER BY ag.created_at DESC LIMIT 1) AS latest_gate_reasoning,
      r.r2_key AS artifact_r2_key,
      r.deck_url,
      (SELECT COUNT(*) FROM assessment_gates ag
       WHERE ag.assessment_id = ps.session_id
         AND ag.verdict IN ('block', 'retry', 'escalate', 'human_assist')) AS blocking_count,
      ps.created_at,
      ps.updated_at,
      har.reviewed_at
    FROM pipeline_status ps
    LEFT JOIN reports r ON r.session_id = ps.session_id
    LEFT JOIN assessment_orders ao ON ao.session_id = ps.session_id
    LEFT JOIN human_assist_reviews har ON har.assessment_id = ps.session_id
    WHERE ps.status IS NOT NULL
      AND (ps.status IN ('human_assist', 'ready', 'completed', 'delayed', 'failed', 'error')
        OR har.status IS NOT NULL)
      ${roleFilter}
    GROUP BY ps.session_id
    ORDER BY
      CASE ps.status
        WHEN 'human_assist' THEN 1
        WHEN 'delayed' THEN 2
        WHEN 'ready' THEN 3
        WHEN 'completed' THEN 3
        ELSE 4
      END,
      ps.created_at ASC
    LIMIT ? OFFSET ?
  `;

  const rows = await input.db.queryAll<QueueQueryRow>(dataSql, ...filterParams, limit, offset);

  const items = rows.map((row) => toQueueItem(row, input.role, input.actorId));

  return {
    items,
    total,
    hasMore: offset + items.length < total
  };
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function toQueueItem(
  row: QueueQueryRow,
  role: 'staff' | 'admin',
  actorId: string
): StaffReportReviewQueueItemDto {
  const governedState = mapBrownfieldReportState({
    pipelineStatus: row.pipeline_status,
    humanAssistStatus: row.review_status,
    artifactPresent: Boolean(row.artifact_r2_key || row.deck_url),
    approvalEvidence: false,
    unresolvedBlockingFindings: row.blocking_count
  });

  const descriptor = buildNextSafeAction(governedState, role, actorId);

  const ageMs = Date.now() - new Date(row.created_at).getTime();
  const ageDays = Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24)));

  return {
    assessmentId: row.session_id,
    clientName: row.customer_name ?? row.company ?? 'Unknown',
    reportState: governedState.state,
    humanReviewState: mapReviewStatus(row.review_status),
    blockerSummary: buildBlockerSummary(governedState),
    owner: row.review_operator_id ?? null,
    ageDays,
    dueDate: row.reviewed_at ?? null,
    nextSafeAction: descriptor,
    priorityReason: buildPriorityReason(governedState, ageDays, row.latest_gate_verdict),
    consequenceOfInaction: buildConsequence(governedState)
  };
}

function buildNextSafeAction(
  state: GovernedReportState,
  role: 'staff' | 'admin',
  actorId: string
): StaffActionDescriptor {
  const actions = getAvailableActions({
    targetType: 'report',
    state,
    actor: { role, staffId: actorId, assignedOperatorId: null, sharedQueue: true }
  });
  // Pick the first actionable (enabled) action, or the first non-blocked action
  return actions.find((a) => a.enabled) ?? actions[0] ?? fallbackDescriptor;
}

const fallbackDescriptor: StaffActionDescriptor = {
  id: 'approveReport',
  targetType: 'report',
  label: 'No safe action available',
  enabled: false,
  requiredRole: 'staff',
  blockedReason: 'notReviewable',
  requiresReasonCode: false,
  requiresNote: false,
  requiredAuditMetadata: [],
  testId: 'staff-action-no-safe-action',
  consequence: 'No action is available for the current state.',
  remediationHint: 'Wait for a reviewable state or recover generation.'
};

function buildBlockerSummary(state: GovernedReportState): string | null {
  if (state.blockedReasons.length === 0) return null;
  return state.blockedReasons
    .map((r) => r.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim())
    .join('; ');
}

function buildPriorityReason(state: GovernedReportState, ageDays: number, latestVerdict: string | null): string {
  if (state.blockedReasons.length > 0) return `Blocked: ${state.blockedReasons[0]}`;
  if (state.risk === RISK_SIGNALS.MEDIUM || state.risk === RISK_SIGNALS.HIGH) return 'Requires review attention';
  if (ageDays > 7) return `Aged ${ageDays} days`;
  if (latestVerdict === 'human_assist' || latestVerdict === 'escalate') return 'Flagged for human review';
  return 'Routine review';
}

function buildConsequence(state: GovernedReportState): string | null {
  if (state.state === REPORT_STATES.ESCALATED) return 'Report delivery is blocked until reviewed.';
  if (state.state === REPORT_STATES.GENERATED) return 'Report is ready for review and delivery.';
  if (state.state === REPORT_STATES.IN_REVIEW) return 'Another staffer is reviewing this report.';
  if (state.state === REPORT_STATES.DELAYED) return 'Generation delay may affect delivery timeline.';
  return null;
}

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
