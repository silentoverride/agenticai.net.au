import {
  BLOCKED_REASONS,
  GATE_FINDING_STATES,
  HUMAN_REVIEW_STATES,
  RISK_SIGNALS,
  type GateFindingState,
  type GovernedGateFindingState,
  type HumanReviewState
} from '../domain/states';

export interface GateFindingStateInput {
  gateVerdict?: string | null;
  humanAssistStatus?: string | null;
  approvalEvidence?: boolean | Record<string, unknown> | null;
  overrideReason?: string | null;
  stale?: boolean;
  conflict?: boolean;
}

export function mapGateFindingState(input: GateFindingStateInput): GovernedGateFindingState {
  const verdict = normalize(input.gateVerdict);
  const humanReviewState = mapHumanReviewState(input.humanAssistStatus);
  const hasApprovalEvidence = Boolean(input.approvalEvidence);
  const blockedReasons = new Set<GovernedGateFindingState['blockedReasons'][number]>();
  let state: GateFindingState;

  if (input.conflict) {
    state = GATE_FINDING_STATES.CONFLICT;
    blockedReasons.add(BLOCKED_REASONS.CONFLICTING_RECORDS);
  } else if (humanReviewState === HUMAN_REVIEW_STATES.IN_REVIEW) {
    state = GATE_FINDING_STATES.IN_REVIEW;
  } else if (humanReviewState === HUMAN_REVIEW_STATES.APPROVED) {
    if (hasApprovalEvidence) {
      state = GATE_FINDING_STATES.RESOLVED;
    } else {
      state = GATE_FINDING_STATES.CONFLICT;
      blockedReasons.add(BLOCKED_REASONS.APPROVAL_EVIDENCE_REQUIRED);
      blockedReasons.add(BLOCKED_REASONS.CONFLICTING_RECORDS);
    }
  } else if (humanReviewState === HUMAN_REVIEW_STATES.EDITED || input.overrideReason) {
    state = GATE_FINDING_STATES.OVERRIDDEN_WITH_REASON;
  } else if (humanReviewState === HUMAN_REVIEW_STATES.REJECTED || verdict === 'escalate' || verdict === 'human_assist') {
    state = GATE_FINDING_STATES.ESCALATED_FURTHER;
  } else if (verdict === 'approve') {
    state = hasApprovalEvidence ? GATE_FINDING_STATES.RESOLVED : GATE_FINDING_STATES.OPEN;
    if (!hasApprovalEvidence) blockedReasons.add(BLOCKED_REASONS.APPROVAL_EVIDENCE_REQUIRED);
  } else {
    state = GATE_FINDING_STATES.OPEN;
    if (verdict === 'block' || verdict === 'retry') {
      blockedReasons.add(BLOCKED_REASONS.UNRESOLVED_BLOCKING_FINDING);
    }
  }

  const risk = blockedReasons.size > 0
    ? RISK_SIGNALS.BLOCKED
    : state === GATE_FINDING_STATES.ESCALATED_FURTHER || state === GATE_FINDING_STATES.IN_REVIEW
      ? RISK_SIGNALS.MEDIUM
      : RISK_SIGNALS.NONE;

  return {
    state,
    humanReviewState,
    risk,
    blockedReasons: Array.from(blockedReasons),
    staleReasons: input.stale ? ['outOfDateFinding'] : [],
    rawVerdict: input.gateVerdict ?? undefined
  };
}

function mapHumanReviewState(value: string | null | undefined): HumanReviewState {
  switch (normalize(value)) {
    case 'pending': return HUMAN_REVIEW_STATES.PENDING;
    case 'in_review': return HUMAN_REVIEW_STATES.IN_REVIEW;
    case 'approved': return HUMAN_REVIEW_STATES.APPROVED;
    case 'rejected': return HUMAN_REVIEW_STATES.REJECTED;
    case 'edited': return HUMAN_REVIEW_STATES.EDITED;
    default: return HUMAN_REVIEW_STATES.NONE;
  }
}

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}
