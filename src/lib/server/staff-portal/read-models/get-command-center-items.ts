import type { AsyncDb } from '$lib/server/db';
import type {
  StaffActionDescriptor,
  StaffCommandCenterItemDto,
  StaffCommandCenterResultDto,
  WorkItemType
} from '$lib/staff-portal/dto';
import { mapBrownfieldReportState } from '../mappers/brownfield-report-state';
import { getAvailableActions } from '../services/get-available-actions';
import { RISK_SIGNALS, type GovernedReportState } from '../domain/states';

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface GetCommandCenterItemsInput {
  db: AsyncDb;
  actorId: string;
  role: 'admin' | 'operator';
  limit?: number;
  offset?: number;
}

// ---------------------------------------------------------------------------
// Row type from the bounded D1 query
// ---------------------------------------------------------------------------

interface CommandCenterQueryRow {
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
// Priority groups (lower number = higher priority)
// ---------------------------------------------------------------------------

const PRIORITY_GROUP: Record<string, number> = {
  escalated: 1,
  delayed: 2,
  generated: 3,
  completed: 4,
  routine: 5
};

/** Lifecycle-blocked reasons indicating a truly passive item with no valid action. */
const LIFECYCLE_BLOCKED_REASONS: ReadonlySet<string> = new Set([
  'notReviewable',
  'alreadyFinalized',
  'missingArtifact',
  'unresolvedBlockingFinding',
  'conflictingRecords',
  'permissionDenied',
  'notAssigned'
]);

function getPriorityGroup(state: GovernedReportState): string {
  if (state.state === 'escalated') return 'escalated';
  if (state.state === 'delayed') return 'delayed';
  if (state.state === 'generated' && !state.approved) return 'generated';
  if (state.state === 'generated' && state.approved) return 'completed';
  return 'routine';
}

function getPriorityReason(group: string, state: GovernedReportState): string {
  switch (group) {
    case 'escalated':
      if (state.blockedReasons.length > 0) return 'Blocked — requires human review';
      return 'Escalated — flagged for human attention';
    case 'delayed':
      return 'Delayed — generation taking longer than expected';
    case 'generated':
      return 'Ready for review — needs approval decision';
    case 'completed':
      return 'Completed — needs delivery decision';
    default:
      if (state.risk === RISK_SIGNALS.HIGH || state.risk === RISK_SIGNALS.MEDIUM) return 'Risk flagged — review recommended';
      return 'Routine — no active blocker';
  }
}

function getConsequence(group: string, state: GovernedReportState): string | null {
  switch (group) {
    case 'escalated':
      return 'Report delivery is blocked until review is completed.';
    case 'delayed':
      return 'Continued delay may affect client delivery timeline.';
    case 'generated':
      return 'Report will not be available for delivery until approved.';
    case 'completed':
      return 'Delivery cannot proceed without an approval decision.';
    default:
      if (state.risk === RISK_SIGNALS.HIGH || state.risk === RISK_SIGNALS.MEDIUM) return 'Risk may escalate if not reviewed.';
      return null;
  }
}

// ---------------------------------------------------------------------------
// Read model
// ---------------------------------------------------------------------------

export async function getCommandCenterItems(
  input: GetCommandCenterItemsInput
): Promise<StaffCommandCenterResultDto> {
  const limit = Math.min(input.limit ?? 50, 100);
  const offset = input.offset ?? 0;

  // Role-based filtering
  const roleFilter = input.role === 'admin'
    ? ''
    : 'AND (har.operator_id IS NULL OR har.operator_id = ?)';

  const filterParams: unknown[] = input.role === 'operator' ? [input.actorId] : [];

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
      CASE
        WHEN ps.status = 'human_assist' THEN 1
        WHEN ps.status = 'delayed' THEN 2
        WHEN ps.status = 'ready' THEN 3
        WHEN ps.status = 'completed' THEN 4
        ELSE 5
      END,
      ps.created_at ASC
    LIMIT ? OFFSET ?
  `;

  const rows = await input.db.queryAll<CommandCenterQueryRow>(dataSql, ...filterParams, limit, offset);

  // Transform rows through governed state mapping, then filter out passive metrics
  // --- Report items ---
  const candidates: StaffCommandCenterItemDto[] = [];

  for (const row of rows) {
    const governedState = mapBrownfieldReportState({
      pipelineStatus: row.pipeline_status,
      humanAssistStatus: row.review_status,
      artifactPresent: Boolean(row.artifact_r2_key || row.deck_url),
      approvalEvidence: false,
      unresolvedBlockingFindings: row.blocking_count
    });

    const nextSafeAction = buildNextSafeAction(governedState, input.role, input.actorId);

    // Filter passive metrics: exclude items where the primary action is lifecycle-blocked
    // (not just missing audit metadata — that's expected in a list context).
    if (isPassiveMetric(nextSafeAction)) {
      continue;
    }

    const group = getPriorityGroup(governedState);
    const priorityRank = PRIORITY_GROUP[group] ?? 99;
    const ageMs = Date.now() - new Date(row.created_at).getTime();
    const ageDays = Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24)));

    candidates.push({
      workItemId: row.session_id,
      workItemType: 'report' as WorkItemType,
      clientName: row.customer_name ?? row.company ?? 'Unknown',
      lifecycleState: governedState.state,
      owner: row.review_operator_id ?? null,
      dueDate: row.reviewed_at ?? null,
      ageDays,
      priorityReason: getPriorityReason(group, governedState),
      consequenceOfInaction: getConsequence(group, governedState),
      priorityRank,
      nextSafeAction
    });
  }

  // --- Follow-up items ---
  // Query due/overdue follow-ups (open only) to surface alongside reports.
  const followUpSql = `
    SELECT
      fu.id,
      fu.assessment_id,
      fu.title,
      fu.owner_id,
      fu.due_date,
      fu.source,
      fu.client_visible_promise,
      fu.consequence_of_inaction,
      ao.customer_name,
      ao.company
    FROM follow_ups fu
    LEFT JOIN assessment_orders ao ON ao.session_id = fu.assessment_id
    WHERE fu.status = 'open'
    ORDER BY
      CASE
        WHEN fu.due_date IS NOT NULL AND fu.due_date < datetime('now') THEN 1
        WHEN fu.due_date IS NOT NULL THEN 2
        ELSE 3
      END,
      fu.due_date ASC
    LIMIT ? OFFSET ?
  `;

  const followUpRows = await input.db.queryAll<{
    id: string;
    assessment_id: string;
    title: string;
    owner_id: string | null;
    due_date: string | null;
    source: string;
    client_visible_promise: number;
    consequence_of_inaction: string | null;
    customer_name: string | null;
    company: string | null;
  }>(followUpSql, limit, offset);

  const now = new Date();
  for (const fw of followUpRows) {
    const isOverdue = fw.due_date !== null && new Date(fw.due_date) < now;
    const dueSoon = fw.due_date !== null && !isOverdue &&
      (new Date(fw.due_date).getTime() - now.getTime()) <= 7 * 24 * 60 * 60 * 1000;

    let priorityRank: number;
    let lifecycleState: string;
    let priorityReason: string;

    if (isOverdue) {
      priorityRank = 6;
      lifecycleState = 'overdue';
      priorityReason = 'Overdue — requires immediate attention';
    } else if (dueSoon) {
      priorityRank = 10;
      lifecycleState = 'due-soon';
      priorityReason = 'Due soon — action needed this week';
    } else if (fw.due_date !== null) {
      priorityRank = 20;
      lifecycleState = 'due-future';
      priorityReason = 'Has a future due date';
    } else {
      priorityRank = 30;
      lifecycleState = 'open';
      priorityReason = 'Open — no due date set';
    }

    candidates.push({
      workItemId: fw.id,
      workItemType: 'followUp',
      clientName: fw.customer_name ?? fw.company ?? 'Unknown',
      lifecycleState,
      owner: fw.owner_id ?? null,
      dueDate: fw.due_date,
      ageDays: 0,
      priorityReason,
      consequenceOfInaction: fw.consequence_of_inaction ??
        (isOverdue ? 'Client commitment is overdue.' : null),
      priorityRank,
      nextSafeAction: {
        id: 'completeFollowUp',
        targetType: 'followUp',
        label: 'Complete follow-up',
        enabled: true,
        requiredRole: 'operator',
        requiresReasonCode: false,
        requiresNote: false,
        requiredAuditMetadata: [],
        testId: 'staff-action-complete-follow-up',
        consequence: 'Commitment remains unresolved.',
        remediationHint: 'Complete or defer the follow-up.'
      }
    });
  }

  // Sort by priority rank then title for determinism
  candidates.sort((a, b) => {
    if (a.priorityRank !== b.priorityRank) return a.priorityRank - b.priorityRank;
    return (a.clientName ?? '').localeCompare(b.clientName ?? '');
  });

  // Combined total for pagination: reports (from DB count) + follow-ups
  const combinedTotal = total + followUpRows.length;

  return {
    items: candidates,
    total: combinedTotal,
    hasMore: offset + candidates.length < combinedTotal
  };
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function isPassiveMetric(action: StaffActionDescriptor): boolean {
  // If the action is blocked by a lifecycle reason (not audit metadata), it's passive
  if (action.blockedReason && LIFECYCLE_BLOCKED_REASONS.has(action.blockedReason)) {
    return true;
  }
  // If there are no actions at all, it's passive
  return false;
}

function buildNextSafeAction(
  state: GovernedReportState,
  role: 'admin' | 'operator',
  actorId: string
): StaffActionDescriptor {
  const actions = getAvailableActions({
    targetType: 'report',
    state,
    actor: { role, operatorId: actorId, assignedOperatorId: null, sharedQueue: true }
  });

  // Find first enabled action, or first non-lifecycle-blocked action, or fallback
  const enabled = actions.find((a) => a.enabled);
  if (enabled) return enabled;

  const nonLifecycleBlocked = actions.find(
    (a) => !a.blockedReason || !LIFECYCLE_BLOCKED_REASONS.has(a.blockedReason)
  );
  if (nonLifecycleBlocked) return nonLifecycleBlocked;

  return actions[0] ?? fallbackDescriptor;
}

const fallbackDescriptor: StaffActionDescriptor = {
  id: 'approveReport',
  targetType: 'report',
  label: 'No safe action available',
  enabled: false,
  requiredRole: 'operator',
  blockedReason: 'notReviewable',
  requiresReasonCode: false,
  requiresNote: false,
  requiredAuditMetadata: [],
  testId: 'staff-action-no-safe-action',
  consequence: 'No action is available for the current state.',
  remediationHint: 'Wait for a reviewable state or recover generation.'
};
