import {
  BLOCKED_REASONS,
  HUMAN_REVIEW_STATES,
  REPORT_STATES,
  RISK_SIGNALS,
  type GovernedReportState,
  type HumanReviewState,
  type ReportState
} from '../domain/states';

export interface BrownfieldReportStateInput {
  pipelineStatus?: string | null;
  humanAssistStatus?: string | null;
  artifactPresent?: boolean;
  approvalEvidence?: boolean | Record<string, unknown> | null;
  unresolvedBlockingFindings?: number;
  stale?: boolean;
  conflict?: boolean;
}

const RUNNING_STATUSES = new Set(['running_llm', 'running_tools', 'running_deck', 'generating']);
const QUEUED_STATUSES = new Set(['pending', 'pending_payment', 'queued']);
const TERMINAL_GENERATED_STATUSES = new Set(['ready', 'completed', 'delivered']);
const FAILED_STATUSES = new Set(['failed', 'error']);

export function mapBrownfieldReportState(input: BrownfieldReportStateInput): GovernedReportState {
  const pipelineStatus = normalize(input.pipelineStatus);
  const humanReviewState = mapHumanReviewState(input.humanAssistStatus);
  const artifactPresent = input.artifactPresent === true;
  const hasApprovalEvidence = Boolean(input.approvalEvidence);
  const unresolvedBlockingFindings = input.unresolvedBlockingFindings ?? 0;
  const blockedReasons = new Set<GovernedReportState['blockedReasons'][number]>();

  if (input.conflict) blockedReasons.add(BLOCKED_REASONS.CONFLICTING_RECORDS);
  if (FAILED_STATUSES.has(pipelineStatus) && humanReviewState === HUMAN_REVIEW_STATES.APPROVED) {
    blockedReasons.add(BLOCKED_REASONS.CONFLICTING_RECORDS);
  }
  if (!artifactPresent) blockedReasons.add(BLOCKED_REASONS.MISSING_ARTIFACT);
  if (unresolvedBlockingFindings > 0) blockedReasons.add(BLOCKED_REASONS.UNRESOLVED_BLOCKING_FINDING);

  let state: ReportState;

  if (input.conflict) {
    state = REPORT_STATES.CONFLICT;
  } else if (humanReviewState === HUMAN_REVIEW_STATES.REJECTED) {
    state = REPORT_STATES.REJECTED;
  } else if (humanReviewState === HUMAN_REVIEW_STATES.EDITED) {
    state = REPORT_STATES.REGENERATION_REQUIRED;
  } else if (humanReviewState === HUMAN_REVIEW_STATES.IN_REVIEW) {
    state = REPORT_STATES.IN_REVIEW;
  } else if (FAILED_STATUSES.has(pipelineStatus) && humanReviewState === HUMAN_REVIEW_STATES.APPROVED) {
    state = REPORT_STATES.CONFLICT;
  } else if (humanReviewState === HUMAN_REVIEW_STATES.PENDING || pipelineStatus === 'human_assist') {
    state = REPORT_STATES.ESCALATED;
  } else if (humanReviewState === HUMAN_REVIEW_STATES.APPROVED) {
    state = hasApprovalEvidence && artifactPresent && unresolvedBlockingFindings === 0
      ? REPORT_STATES.APPROVED
      : REPORT_STATES.CONFLICT;
    if (state === REPORT_STATES.CONFLICT) {
      if (!hasApprovalEvidence) blockedReasons.add(BLOCKED_REASONS.APPROVAL_EVIDENCE_REQUIRED);
      if (!artifactPresent) blockedReasons.add(BLOCKED_REASONS.MISSING_ARTIFACT);
      if (unresolvedBlockingFindings > 0) blockedReasons.add(BLOCKED_REASONS.UNRESOLVED_BLOCKING_FINDING);
      blockedReasons.add(BLOCKED_REASONS.CONFLICTING_RECORDS);
    }
  } else if (FAILED_STATUSES.has(pipelineStatus)) {
    state = REPORT_STATES.UNAVAILABLE;
  } else if (pipelineStatus === 'delayed') {
    state = REPORT_STATES.DELAYED;
  } else if (RUNNING_STATUSES.has(pipelineStatus)) {
    state = REPORT_STATES.GENERATING;
  } else if (QUEUED_STATUSES.has(pipelineStatus)) {
    state = REPORT_STATES.QUEUED;
  } else if (TERMINAL_GENERATED_STATUSES.has(pipelineStatus) || artifactPresent) {
    state = artifactPresent ? REPORT_STATES.GENERATED : REPORT_STATES.UNAVAILABLE;
  } else {
    state = REPORT_STATES.UNAVAILABLE;
  }

  if (state === REPORT_STATES.GENERATED && !hasApprovalEvidence) {
    blockedReasons.add(BLOCKED_REASONS.APPROVAL_EVIDENCE_REQUIRED);
  }

  const approved = state === REPORT_STATES.APPROVED;
  const risk = blockedReasons.size > 0
    ? RISK_SIGNALS.BLOCKED
    : state === REPORT_STATES.DELAYED || state === REPORT_STATES.ESCALATED || state === REPORT_STATES.IN_REVIEW
      ? RISK_SIGNALS.MEDIUM
      : RISK_SIGNALS.NONE;

  return {
    state,
    humanReviewState,
    approved,
    canDeliver: approved && artifactPresent,
    artifactPresent,
    risk,
    blockedReasons: Array.from(blockedReasons),
    staleReasons: input.stale ? ['staleVersion'] : [],
    rawStatus: input.pipelineStatus ?? undefined
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
