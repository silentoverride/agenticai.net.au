// Client-safe Staff Portal DTOs and presentation metadata.
// This module must stay serializable and must not import server-only modules.

export type StaffRole = 'admin' | 'operator';

export type ReportState =
  | 'queued'
  | 'generating'
  | 'delayed'
  | 'generated'
  | 'escalated'
  | 'inReview'
  | 'approved'
  | 'rejected'
  | 'regenerationRequired'
  | 'clarificationRequired'
  | 'conflict'
  | 'unavailable';

export type GateFindingState =
  | 'open'
  | 'inReview'
  | 'resolved'
  | 'overriddenWithReason'
  | 'escalatedFurther'
  | 'conflict';

export type HumanReviewState = 'none' | 'pending' | 'inReview' | 'approved' | 'rejected' | 'edited';

export type StaffPortalTargetType = 'report' | 'gateFinding' | 'followUp' | 'meetingBrief' | 'commercialNextStep';

export type PresentationTone =
  | 'neutral'
  | 'attention'
  | 'warning'
  | 'danger'
  | 'success'
  | 'audit'
  | 'disabled';

export type BlockedReason =
  | 'permissionDenied'
  | 'notAssigned'
  | 'approvalEvidenceRequired'
  | 'unresolvedBlockingFinding'
  | 'missingArtifact'
  | 'conflictingRecords'
  | 'notReviewable'
  | 'alreadyFinalized'
  | 'auditMetadataRequired';

export type StaleReason = 'staleVersion' | 'supersededArtifact' | 'outOfDateFinding';

export type RequiredAuditMetadata =
  | 'operatorId'
  | 'reasonCode'
  | 'note'
  | 'checklistVersion'
  | 'evidenceId'
  | 'artifactVersion';

export type RiskSignal = 'none' | 'low' | 'medium' | 'high' | 'blocked';

export type StaffPortalActionId =
  | 'claimFinding'
  | 'resolveFinding'
  | 'overrideFinding'
  | 'escalateFinding'
  | 'approveReport'
  | 'rejectReport'
  | 'requestRegeneration'
  | 'requestClarification'
  | 'completeFollowUp'
  | 'deferFollowUp'
  | 'reassignFollowUp'
  | 'changeMeetingBriefStatus';

export interface StatePresentationMetadata {
  label: string;
  tone: PresentationTone;
  accessibleLabel: string;
  description: string;
  remediationHint: string;
  testId: string;
}

export interface StaffActionDescriptor {
  id: StaffPortalActionId;
  targetType: StaffPortalTargetType;
  label: string;
  enabled: boolean;
  requiredRole: StaffRole;
  blockedReason?: BlockedReason;
  staleReason?: StaleReason;
  requiresReasonCode: boolean;
  requiresNote: boolean;
  requiredAuditMetadata: RequiredAuditMetadata[];
  testId: string;
  consequence: string;
  remediationHint: string;
}

export interface GovernedReportDto {
  id: string;
  state: ReportState;
  humanReviewState: HumanReviewState;
  approved: boolean;
  canDeliver: boolean;
  artifactPresent: boolean;
  risk: RiskSignal;
  blockedReasons: BlockedReason[];
  staleReasons: StaleReason[];
  actions: StaffActionDescriptor[];
}

export interface GovernedGateFindingDto {
  id: string;
  state: GateFindingState;
  humanReviewState: HumanReviewState;
  risk: RiskSignal;
  blockedReasons: BlockedReason[];
  staleReasons: StaleReason[];
  actions: StaffActionDescriptor[];
}

export type StaffActionErrorCode =
  | 'staleState'
  | 'permissionDenied'
  | 'blockedAction'
  | 'duplicateAction'
  | 'validationFailed'
  | 'auditWriteFailed';

export type StaffActionState = ReportState | GateFindingState | FollowUpStatus | MeetingBriefState | CommercialNextStepStatus;

export interface StaffActionReceiptDto {
  id: string;
  assessmentId: string;
  target: {
    type: StaffPortalTargetType;
    id: string | null;
  };
  action: StaffPortalActionId;
  actorId: string;
  previousState: StaffActionState;
  resultingState: StaffActionState;
  reasonCode: string | null;
  reason: string | null;
  auditReference: string;
  createdAt: string;
}

export interface StaffActionMutationErrorDto {
  code: StaffActionErrorCode;
  message: string;
  currentState?: StaffActionState;
}

export type StaffActionMutationResultDto =
  | { success: true; receipt: StaffActionReceiptDto; state: StaffActionState }
  | { success: false; error: StaffActionMutationErrorDto };

export const REPORT_STATE_PRESENTATION: Record<ReportState, StatePresentationMetadata> = {
  queued: {
    label: 'Queued',
    tone: 'neutral',
    accessibleLabel: 'Report queued',
    description: 'The assessment is waiting to be processed.',
    remediationHint: 'Wait for generation to begin before making a review decision.',
    testId: 'report-state-queued'
  },
  generating: {
    label: 'Generating',
    tone: 'attention',
    accessibleLabel: 'Report generating',
    description: 'The assessment output is still being generated.',
    remediationHint: 'Review actions become available after generation completes.',
    testId: 'report-state-generating'
  },
  delayed: {
    label: 'Delayed',
    tone: 'warning',
    accessibleLabel: 'Report delayed',
    description: 'Generation is taking longer than expected.',
    remediationHint: 'Monitor the pipeline and escalate if delay persists.',
    testId: 'report-state-delayed'
  },
  generated: {
    label: 'Generated',
    tone: 'attention',
    accessibleLabel: 'Report generated and awaiting review',
    description: 'A report artifact exists, but it has not been approved.',
    remediationHint: 'Complete the review checklist before approving delivery.',
    testId: 'report-state-generated'
  },
  escalated: {
    label: 'Escalated',
    tone: 'warning',
    accessibleLabel: 'Report escalated for human assist',
    description: 'A gate or pipeline condition requires specialist review.',
    remediationHint: 'Open the flagged findings before deciding the report.',
    testId: 'report-state-escalated'
  },
  inReview: {
    label: 'In review',
    tone: 'audit',
    accessibleLabel: 'Report in review',
    description: 'An operator has claimed or started the review.',
    remediationHint: 'Finish the review or hand off with notes.',
    testId: 'report-state-in-review'
  },
  approved: {
    label: 'Approved',
    tone: 'success',
    accessibleLabel: 'Report approved',
    description: 'Approval evidence is present and no blocking finding remains.',
    remediationHint: 'Proceed with delivery only through audited actions.',
    testId: 'report-state-approved'
  },
  rejected: {
    label: 'Rejected',
    tone: 'danger',
    accessibleLabel: 'Report rejected',
    description: 'The report was rejected by human review.',
    remediationHint: 'Capture the rejection reason and follow the recovery path.',
    testId: 'report-state-rejected'
  },
  regenerationRequired: {
    label: 'Regeneration required',
    tone: 'warning',
    accessibleLabel: 'Report requires regeneration',
    description: 'Edited content or review outcome requires a new report version.',
    remediationHint: 'Regenerate before considering delivery.',
    testId: 'report-state-regeneration-required'
  },
  clarificationRequired: {
    label: 'Clarification required',
    tone: 'warning',
    accessibleLabel: 'Report requires clarification',
    description: 'The current evidence is insufficient for a safe decision.',
    remediationHint: 'Collect missing context before continuing.',
    testId: 'report-state-clarification-required'
  },
  conflict: {
    label: 'Conflict',
    tone: 'danger',
    accessibleLabel: 'Report state conflict',
    description: 'Records disagree about the report lifecycle.',
    remediationHint: 'Resolve conflicting records before approval or delivery.',
    testId: 'report-state-conflict'
  },
  unavailable: {
    label: 'Unavailable',
    tone: 'disabled',
    accessibleLabel: 'Report unavailable',
    description: 'No usable report artifact is available.',
    remediationHint: 'Recover the artifact or restart generation.',
    testId: 'report-state-unavailable'
  }
};

export const GATE_FINDING_STATE_PRESENTATION: Record<GateFindingState, StatePresentationMetadata> = {
  open: {
    label: 'Open',
    tone: 'attention',
    accessibleLabel: 'Gate finding open',
    description: 'A gate finding is unresolved.',
    remediationHint: 'Review evidence before resolving or escalating.',
    testId: 'gate-finding-state-open'
  },
  inReview: {
    label: 'In review',
    tone: 'audit',
    accessibleLabel: 'Gate finding in review',
    description: 'An operator is reviewing this finding.',
    remediationHint: 'Complete the finding decision with an audit note.',
    testId: 'gate-finding-state-in-review'
  },
  resolved: {
    label: 'Resolved',
    tone: 'success',
    accessibleLabel: 'Gate finding resolved',
    description: 'The finding has explicit resolution evidence.',
    remediationHint: 'No further action is needed unless records become stale.',
    testId: 'gate-finding-state-resolved'
  },
  overriddenWithReason: {
    label: 'Overridden with reason',
    tone: 'audit',
    accessibleLabel: 'Gate finding overridden with reason',
    description: 'An operator override exists with a recorded reason.',
    remediationHint: 'Ensure the override reason is visible in the audit trail.',
    testId: 'gate-finding-state-overridden-with-reason'
  },
  escalatedFurther: {
    label: 'Escalated further',
    tone: 'warning',
    accessibleLabel: 'Gate finding escalated further',
    description: 'The finding needs additional review before resolution.',
    remediationHint: 'Assign to an appropriate reviewer or request clarification.',
    testId: 'gate-finding-state-escalated-further'
  },
  conflict: {
    label: 'Conflict',
    tone: 'danger',
    accessibleLabel: 'Gate finding state conflict',
    description: 'Records disagree about this finding.',
    remediationHint: 'Resolve the conflicting gate and review records.',
    testId: 'gate-finding-state-conflict'
  }
};

/** Human-readable labels for report-level actions used in receipts and timelines. */
export const REPORT_ACTION_PRESENTATION: Record<string, { label: string }> = {
  approveReport: { label: 'Approve Report' },
  rejectReport: { label: 'Reject Report' },
  requestRegeneration: { label: 'Request Regeneration' },
  requestClarification: { label: 'Request Clarification' }
};

/** Human-readable labels for gate-finding actions used in receipts and timelines. */
export const GATE_FINDING_ACTION_PRESENTATION: Record<string, { label: string }> = {
  claimFinding: { label: 'Claim Finding' },
  resolveFinding: { label: 'Resolve Finding' },
  overrideFinding: { label: 'Override Finding' },
  escalateFinding: { label: 'Escalate Finding' }
};

export const FOLLOW_UP_ACTION_PRESENTATION: Record<string, { label: string }> = {
  completeFollowUp: { label: 'Complete Follow-up' },
  deferFollowUp: { label: 'Defer Follow-up' },
  reassignFollowUp: { label: 'Reassign Follow-up' }
};

export const BLOCKED_REASON_PRESENTATION: Record<BlockedReason, StatePresentationMetadata> = {
  permissionDenied: {
    label: 'Permission denied', tone: 'disabled', accessibleLabel: 'Action blocked by permission',
    description: 'The current role cannot perform this action.', remediationHint: 'Ask an admin or assigned operator to continue.', testId: 'blocked-permission-denied'
  },
  notAssigned: {
    label: 'Not assigned', tone: 'disabled', accessibleLabel: 'Action blocked because item is not assigned',
    description: 'This item is not in the operator assignment scope.', remediationHint: 'Claim the item or use the shared queue.', testId: 'blocked-not-assigned'
  },
  approvalEvidenceRequired: {
    label: 'Approval evidence required', tone: 'warning', accessibleLabel: 'Action blocked by missing approval evidence',
    description: 'Approval requires explicit evidence.', remediationHint: 'Complete the review checklist before approval.', testId: 'blocked-approval-evidence-required'
  },
  unresolvedBlockingFinding: {
    label: 'Blocking finding open', tone: 'danger', accessibleLabel: 'Action blocked by unresolved finding',
    description: 'A blocking gate finding remains unresolved.', remediationHint: 'Resolve or override the finding with a reason.', testId: 'blocked-unresolved-finding'
  },
  missingArtifact: {
    label: 'Missing artifact', tone: 'danger', accessibleLabel: 'Action blocked by missing artifact',
    description: 'The report artifact is missing.', remediationHint: 'Recover or regenerate the report artifact.', testId: 'blocked-missing-artifact'
  },
  conflictingRecords: {
    label: 'Conflicting records', tone: 'danger', accessibleLabel: 'Action blocked by conflicting records',
    description: 'Lifecycle records disagree.', remediationHint: 'Resolve the state conflict before continuing.', testId: 'blocked-conflicting-records'
  },
  notReviewable: {
    label: 'Not reviewable', tone: 'disabled', accessibleLabel: 'Action blocked because item is not reviewable',
    description: 'This lifecycle state cannot be reviewed yet.', remediationHint: 'Wait for a reviewable state or recover generation.', testId: 'blocked-not-reviewable'
  },
  alreadyFinalized: {
    label: 'Already finalized', tone: 'disabled', accessibleLabel: 'Action blocked because item is finalized',
    description: 'This item already has a final decision.', remediationHint: 'Use an audited correction flow if required.', testId: 'blocked-already-finalized'
  },
  auditMetadataRequired: {
    label: 'Audit metadata required', tone: 'warning', accessibleLabel: 'Action blocked by missing audit metadata',
    description: 'Required audit fields are missing.', remediationHint: 'Provide the required note, reason code, and evidence metadata.', testId: 'blocked-audit-metadata-required'
  }
};

export const STALE_REASON_PRESENTATION: Record<StaleReason, StatePresentationMetadata> = {
  staleVersion: {
    label: 'Stale version', tone: 'warning', accessibleLabel: 'Action blocked by stale version',
    description: 'The item version is older than the current source.', remediationHint: 'Refresh before acting.', testId: 'stale-version'
  },
  supersededArtifact: {
    label: 'Superseded artifact', tone: 'warning', accessibleLabel: 'Action blocked by superseded artifact',
    description: 'A newer report artifact exists.', remediationHint: 'Review the latest artifact.', testId: 'stale-superseded-artifact'
  },
  outOfDateFinding: {
    label: 'Out-of-date finding', tone: 'warning', accessibleLabel: 'Action blocked by out-of-date finding',
    description: 'The finding no longer matches current evidence.', remediationHint: 'Refresh gate evidence before deciding.', testId: 'stale-out-of-date-finding'
  }
};

export const RISK_SIGNAL_PRESENTATION: Record<RiskSignal, StatePresentationMetadata> = {
  none: { label: 'No risk', tone: 'neutral', accessibleLabel: 'No risk signal', description: 'No risk is currently signalled.', remediationHint: 'Continue normal review.', testId: 'risk-none' },
  low: { label: 'Low risk', tone: 'neutral', accessibleLabel: 'Low risk signal', description: 'Low risk signal present.', remediationHint: 'Continue with standard checks.', testId: 'risk-low' },
  medium: { label: 'Medium risk', tone: 'attention', accessibleLabel: 'Medium risk signal', description: 'Medium risk signal present.', remediationHint: 'Review supporting evidence carefully.', testId: 'risk-medium' },
  high: { label: 'High risk', tone: 'warning', accessibleLabel: 'High risk signal', description: 'High risk signal present.', remediationHint: 'Escalate if evidence is incomplete.', testId: 'risk-high' },
  blocked: { label: 'Blocked', tone: 'danger', accessibleLabel: 'Blocked risk signal', description: 'A blocking risk exists.', remediationHint: 'Resolve blockers before approval.', testId: 'risk-blocked' }
};

// ---------------------------------------------------------------------------
// Review Queue & Workspace DTOs (Story 1.3)
// ---------------------------------------------------------------------------

export interface StaffReportReviewQueueItemDto {
  assessmentId: string;
  clientName: string;
  reportState: ReportState;
  humanReviewState: HumanReviewState;
  blockerSummary: string | null;
  owner: string | null;
  ageDays: number;
  dueDate: string | null;
  nextSafeAction: StaffActionDescriptor;
  priorityReason: string;
  consequenceOfInaction: string | null;
}

export interface StaffAssessmentReviewDto {
  assessmentId: string;
  clientName: string;
  reportState: ReportState;
  humanReviewState: HumanReviewState;
  canDeliver: boolean;
  reportContext: StaffReportContextDto;
  linkedGateFindings: StaffGateFindingDto[];
  artifactHistory: StaffArtifactVersionDto[];
  availableActions: StaffActionDescriptor[];
  statePresentation: StatePresentationMetadata;
  blockedReasons: StaffBlockedReasonDto[];
}

export interface StaffReportContextDto {
  businessName: string;
  owner: string | null;
  journeyStage: string | null;
  riskFlags: string[];
  valueFlags: string[];
}

export interface StaffGateFindingDto {
  id: string;
  type: string;
  verdict: string;
  confidence: number | null;
  severity: string | null;
  reasoning: string | null;
  details: string | null;
  flaggedReportSection: string | null;
  relatedIntakeEvidence: string | null;
  suggestedInspectionSteps: string | null;
  state: GateFindingState;
  decisionNotes: string | null;
  riskSignal: RiskSignalPresentationDto;
  actions: StaffActionDescriptor[];
}

export interface RiskSignalPresentationDto {
  tone: PresentationTone;
  label: string;
  description: string;
  testId: string;
}

export interface StaffArtifactVersionDto {
  versionId: string;
  type: 'original' | 'edited' | 'regenerated' | 'historical';
  createdAt: string;
  label: string;
  available: boolean;
  url?: string;
}

export interface StaffBlockedReasonDto {
  reason: BlockedReason;
  label: string;
  tone: PresentationTone;
  description: string;
  remediationHint: string;
  testId: string;
}

// ---------------------------------------------------------------------------
// Command Center DTOs (Story 2.1)
// ---------------------------------------------------------------------------

export type WorkItemType = 'report' | 'followUp' | 'meetingBrief' | 'commercialNextStep';

export interface StaffCommandCenterItemDto {
  workItemId: string;
  workItemType: WorkItemType;
  clientName: string;
  lifecycleState: string;
  owner: string | null;
  dueDate: string | null;
  ageDays: number;
  priorityReason: string;
  consequenceOfInaction: string | null;
  priorityRank: number;
  nextSafeAction: StaffActionDescriptor;
}

export interface StaffCommandCenterResultDto {
  items: StaffCommandCenterItemDto[];
  total: number;
  hasMore: boolean;
}

// ---------------------------------------------------------------------------
// Client Profile Snapshot DTOs (Story 3.1)
// ---------------------------------------------------------------------------

export type MeetingBriefState = 'draft' | 'needsReview' | 'ready' | 'stale' | 'completed' | 'not_available';

// ---------------------------------------------------------------------------
// Meeting Brief DTO (Story 5.1)
// ---------------------------------------------------------------------------

export interface StaffMeetingBriefDto {
  id: string;
  assessmentId: string;
  meetingDate: string | null;
  objective: string | null;
  talkingPoints: string | null;
  sensitiveIssues: string | null;
  offerNextStep: string | null;
  followUpIntention: string | null;
  finalAgendaNotes: string | null;
  prepChecklist: string | null;
  status: MeetingBriefState;
  linkedReportId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingBriefStalenessWarning {
  stale: boolean;
  reason?: 'idleLongerThan30Days' | 'linkedReportChanged';
  message?: string;
  lastUpdated: string | null;
  daysSinceUpdate: number | null;
}

export type FollowUpState = 'open' | 'completed' | 'deferred' | 'reassigned' | 'not_available';
export type CommercialNextStepStatus = 'noAction' | 'nurture' | 'discussOffer' | 'sendFollowUp' | 'createFutureOpportunity' | 'not_available';

export type CommercialDisplayState = 'missing' | 'draft' | 'active' | 'needsFollowUp' | 'completed' | 'deferred' | 'cancelled' | 'stale';

export interface StaffCommercialNextStepDto {
  id: string;
  assessmentId: string;
  status: CommercialNextStepStatus;
  owner: string | null;
  notes: string | null;
  displayState: CommercialDisplayState;
  createdAt: string;
  updatedAt: string;
}
export type ErrorCode = 'not_found' | 'permission_denied' | 'stale_data' | 'degraded';

export interface StaffClientProfileSnapshotDto {
  clientId: string;
  businessName: string;
  ownerName: string;
  journeyStage: string;
  riskFlags: string[];
  valueFlags: string[];
  reportState: ReportState;
  humanReviewState: HumanReviewState;
  meetingBriefState: MeetingBriefState;
  followUpState: FollowUpState;
  commercialNextStepStatus: CommercialNextStepStatus;
}

export interface StaffClientProfileResultDto {
  profile: StaffClientProfileSnapshotDto | null;
  hasData: boolean;
  degradedFields: string[];
  errorCode: ErrorCode | null;
}

// ---------------------------------------------------------------------------
// What Matters Now DTOs (Story 3.2)
// ---------------------------------------------------------------------------

export type PrimaryTreatment =
  | 'blocked'
  | 'requires_decision'
  | 'at_risk'
  | 'draft_stale'
  | 'ready'
  | 'completed'
  | 'all_clear';

export type BlockerType = 'report_blocker' | 'gate_finding' | 'follow_up' | 'meeting_brief' | 'commercial';
export type SourceDomain = 'report_review' | 'gate_finding' | 'follow_up' | 'meeting_brief' | 'commercial';

export interface StaffBlockerInfoDto {
  blockerName: string | null;
  blockerType: BlockerType | null;
}

export interface StaffWhatMattersNowDto {
  primaryTreatment: PrimaryTreatment;
  blocker: StaffBlockerInfoDto;
  nextValidAction: string | null;
  nextActionRoute: string | null;
  ownerName: string | null;
  dueDate: string | null;
  consequenceOfInaction: string | null;
  sourceDomain: SourceDomain | null;
  precedenceLevel: number;
}

// ---------------------------------------------------------------------------
// Linked Reports & Gate Findings DTOs (Story 3.3)
// ---------------------------------------------------------------------------

export interface StaffLinkedReportDto {
  reportId: string;
  title: string;
  reportState: ReportState;
  humanReviewState: HumanReviewState;
  artifactVersion: string | null;
  createdAt: string;
  hasArtifacts: boolean;
  degradedFields: string[];
  reviewWorkspaceRoute: string;
}

export interface StaffLinkedGateFindingDto {
  findingId: string;
  type: string;
  verdict: string;
  confidence: number | null;
  severity: string | null;
  reasoning: string | null;
  details: string | null;
  flaggedSection: string | null;
  relatedIntakeEvidence: string | null;
  suggestedInspectionSteps: string | null;
  decisionState: GateFindingState;
  linkedReportId: string;
  isBlocking: boolean;
}

export interface StaffLinkedContextSectionDto {
  reports: StaffLinkedReportDto[];
  findings: StaffLinkedGateFindingDto[];
  totalReports: number;
  totalFindings: number;
}

// ---------------------------------------------------------------------------
// Activity Memory & Audit History DTOs (Story 3.4)
// ---------------------------------------------------------------------------

export type AuditEventType =
  | 'report_state_change'
  | 'gate_finding_decision'
  | 'follow_up_change'
  | 'meeting_brief_change'
  | 'commercial_change'
  | 'ownership_change';

export type AffectedEntityType =
  | 'report'
  | 'gate_finding'
  | 'follow_up'
  | 'meeting_brief'
  | 'commercial_next_step';

export interface StaffAuditEventDto {
  eventId: string;
  actor: string;
  timestamp: string;
  eventType: AuditEventType;
  affectedEntity: string;
  affectedEntityType: AffectedEntityType;
  previousState: string | null;
  newState: string;
  reasonOrNote: string | null;
  receiptRoute: string | null;
  sourceContextRoute: string | null;
}

export type ActivitySourceDomain =
  | 'pipeline'
  | 'assessment'
  | 'gate'
  | 'human_review'
  | 'follow_up'
  | 'meeting_brief'
  | 'commercial';

export interface StaffActivityEventDto {
  activityId: string;
  summary: string;
  timestamp: string;
  sourceDomain: ActivitySourceDomain;
  actor: string | null;
}

export interface StaffAuditTrailResultDto {
  events: StaffAuditEventDto[];
  total: number;
  hasMore: boolean;
}

// ---------------------------------------------------------------------------
// Follow-up DTOs (Epic 4)
// ---------------------------------------------------------------------------

export type FollowUpStatus = 'open' | 'completed' | 'deferred' | 'reassigned';
export type FollowUpSource = 'client_profile' | 'human_review' | 'meeting_brief' | 'commercial_next_step' | 'support_issue' | 'admin_task' | 'delayed_journey';

export interface StaffFollowUpDto {
  id: string;
  assessmentId: string;
  title: string;
  description: string | null;
  ownerId: string | null;
  dueDate: string | null;
  source: FollowUpSource;
  status: FollowUpStatus;
  clientVisiblePromise: boolean;
  consequenceOfInaction: string | null;
  notes: string | null;
  linkedReportId: string | null;
  linkedGateFindingId: string | null;
  linkedMeetingBriefId: string | null;
  linkedCommercialStepId: string | null;
  supportIssueRef: string | null;
  adminTaskRef: string | null;
  delayedJourneyState: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFollowUpInput {
  assessmentId: string;
  title: string;
  description?: string;
  ownerId?: string;
  dueDate?: string;
  source: FollowUpSource;
  clientVisiblePromise?: boolean;
  consequenceOfInaction?: string;
  notes?: string;
  linkedReportId?: string;
  linkedGateFindingId?: string;
  linkedMeetingBriefId?: string;
  linkedCommercialStepId?: string;
  supportIssueRef?: string;
  adminTaskRef?: string;
  delayedJourneyState?: string;
}

export interface UpdateFollowUpActionInput {
  followUpId: string;
  actorId: string;
  assessmentId: string;
  action: 'completeFollowUp' | 'deferFollowUp' | 'reassignFollowUp';
  reason?: string;
  newOwnerId?: string;
  idempotencyKey: string;
}

export type FollowUpActionReceiptDto = StaffActionReceiptDto;

export const FOLLOW_UP_STATE_PRESENTATION: Record<FollowUpStatus, StatePresentationMetadata> = {
  open: {
    label: 'Open', tone: 'attention', accessibleLabel: 'Follow-up open',
    description: 'The follow-up commitment has not been completed.',
    remediationHint: 'Complete the follow-up or defer it with a reason.',
    testId: 'follow-up-state-open'
  },
  completed: {
    label: 'Completed', tone: 'success', accessibleLabel: 'Follow-up completed',
    description: 'The follow-up has been resolved.',
    remediationHint: 'No further action is needed.',
    testId: 'follow-up-state-completed'
  },
  deferred: {
    label: 'Deferred', tone: 'warning', accessibleLabel: 'Follow-up deferred',
    description: 'The follow-up was deferred with a recorded reason.',
    remediationHint: 'Review the deferral reason and reschedule if needed.',
    testId: 'follow-up-state-deferred'
  },
  reassigned: {
    label: 'Reassigned', tone: 'audit', accessibleLabel: 'Follow-up reassigned',
    description: 'The follow-up was reassigned to another staff member.',
    remediationHint: 'Confirm the new owner has accepted the commitment.',
    testId: 'follow-up-state-reassigned'
  }
};
