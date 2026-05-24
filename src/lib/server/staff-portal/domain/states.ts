import type {
  BlockedReason,
  GateFindingState,
  HumanReviewState,
  ReportState,
  RiskSignal,
  StaleReason
} from '$lib/staff-portal/dto';

export type {
  BlockedReason,
  GateFindingState,
  HumanReviewState,
  ReportState,
  RiskSignal,
  StaleReason
};

export const REPORT_STATES = {
  QUEUED: 'queued',
  GENERATING: 'generating',
  DELAYED: 'delayed',
  GENERATED: 'generated',
  ESCALATED: 'escalated',
  IN_REVIEW: 'inReview',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REGENERATION_REQUIRED: 'regenerationRequired',
  CLARIFICATION_REQUIRED: 'clarificationRequired',
  CONFLICT: 'conflict',
  UNAVAILABLE: 'unavailable'
} as const satisfies Record<string, ReportState>;

export const GATE_FINDING_STATES = {
  OPEN: 'open',
  IN_REVIEW: 'inReview',
  RESOLVED: 'resolved',
  OVERRIDDEN_WITH_REASON: 'overriddenWithReason',
  ESCALATED_FURTHER: 'escalatedFurther',
  CONFLICT: 'conflict'
} as const satisfies Record<string, GateFindingState>;

export const HUMAN_REVIEW_STATES = {
  NONE: 'none',
  PENDING: 'pending',
  IN_REVIEW: 'inReview',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EDITED: 'edited'
} as const satisfies Record<string, HumanReviewState>;

export const BLOCKED_REASONS = {
  PERMISSION_DENIED: 'permissionDenied',
  NOT_ASSIGNED: 'notAssigned',
  APPROVAL_EVIDENCE_REQUIRED: 'approvalEvidenceRequired',
  UNRESOLVED_BLOCKING_FINDING: 'unresolvedBlockingFinding',
  MISSING_ARTIFACT: 'missingArtifact',
  CONFLICTING_RECORDS: 'conflictingRecords',
  NOT_REVIEWABLE: 'notReviewable',
  ALREADY_FINALIZED: 'alreadyFinalized',
  AUDIT_METADATA_REQUIRED: 'auditMetadataRequired'
} as const satisfies Record<string, BlockedReason>;

export const STALE_REASONS = {
  STALE_VERSION: 'staleVersion',
  SUPERSEDED_ARTIFACT: 'supersededArtifact',
  OUT_OF_DATE_FINDING: 'outOfDateFinding'
} as const satisfies Record<string, StaleReason>;

export const RISK_SIGNALS = {
  NONE: 'none',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  BLOCKED: 'blocked'
} as const satisfies Record<string, RiskSignal>;

export interface GovernedReportState {
  state: ReportState;
  humanReviewState: HumanReviewState;
  approved: boolean;
  canDeliver: boolean;
  artifactPresent: boolean;
  risk: RiskSignal;
  blockedReasons: BlockedReason[];
  staleReasons: StaleReason[];
  rawStatus?: string;
}

export interface GovernedGateFindingState {
  state: GateFindingState;
  humanReviewState: HumanReviewState;
  risk: RiskSignal;
  blockedReasons: BlockedReason[];
  staleReasons: StaleReason[];
  rawVerdict?: string;
}
