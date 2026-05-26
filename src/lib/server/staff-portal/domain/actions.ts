import type {
  RequiredAuditMetadata,
  StaffPortalActionId,
  StaffPortalTargetType
} from '$lib/staff-portal/dto';

export type { RequiredAuditMetadata, StaffPortalActionId, StaffPortalTargetType };

export const STAFF_ACTIONS = {
  CLAIM_FINDING: 'claimFinding',
  RESOLVE_FINDING: 'resolveFinding',
  OVERRIDE_FINDING: 'overrideFinding',
  ESCALATE_FINDING: 'escalateFinding',
  APPROVE_REPORT: 'approveReport',
  REJECT_REPORT: 'rejectReport',
  REQUEST_REGENERATION: 'requestRegeneration',
  REQUEST_CLARIFICATION: 'requestClarification',
  COMPLETE_FOLLOW_UP: 'completeFollowUp',
  DEFER_FOLLOW_UP: 'deferFollowUp',
  REASSIGN_FOLLOW_UP: 'reassignFollowUp',
  CHANGE_MEETING_BRIEF_STATUS: 'changeMeetingBriefStatus',
  CHANGE_COMMERCIAL_STEP: 'changeCommercialStep'
} as const satisfies Record<string, StaffPortalActionId>;

export const ACTION_AUDIT_REQUIREMENTS: Record<StaffPortalActionId, RequiredAuditMetadata[]> = {
  claimFinding: ['operatorId'],
  resolveFinding: ['operatorId', 'note', 'reasonCode'],
  overrideFinding: ['operatorId', 'note', 'reasonCode'],
  escalateFinding: ['operatorId', 'note', 'reasonCode'],
  approveReport: ['operatorId', 'checklistVersion', 'evidenceId', 'artifactVersion'],
  rejectReport: ['operatorId', 'note', 'reasonCode'],
  requestRegeneration: ['operatorId', 'note', 'reasonCode'],
  requestClarification: ['operatorId', 'note', 'reasonCode'],
  completeFollowUp: ['operatorId', 'note'],
  deferFollowUp: ['operatorId', 'note', 'reasonCode'],
  reassignFollowUp: ['operatorId', 'note'],
  changeMeetingBriefStatus: ['operatorId'],
  changeCommercialStep: ['operatorId']
};

export const ACTIONS_REQUIRING_REASON_CODE = new Set<StaffPortalActionId>([
  'resolveFinding',
  'overrideFinding',
  'escalateFinding',
  'rejectReport',
  'requestRegeneration',
  'requestClarification'
]);

export const ACTIONS_REQUIRING_NOTE = new Set<StaffPortalActionId>([
  'resolveFinding',
  'overrideFinding',
  'escalateFinding',
  'rejectReport',
  'requestRegeneration',
  'requestClarification'
]);
