import {
  ACTION_AUDIT_REQUIREMENTS,
  ACTIONS_REQUIRING_NOTE,
  ACTIONS_REQUIRING_REASON_CODE,
  STAFF_ACTIONS
} from '../domain/actions';
import { canActOnAssignedItem, type StaffRole } from '../domain/roles';
import {
  BLOCKED_REASONS,
  GATE_FINDING_STATES,
  REPORT_STATES,
  type BlockedReason,
  type GovernedGateFindingState,
  type GovernedReportState,
  type StaleReason
} from '../domain/states';
import type { RequiredAuditMetadata, StaffActionDescriptor, StaffPortalActionId, StaffPortalTargetType } from '$lib/staff-portal/dto';

export type ActionTarget =
  | { targetType: 'report'; state: GovernedReportState }
  | { targetType: 'gateFinding'; state: GovernedGateFindingState };

export type GetAvailableActionsInput = ActionTarget & {
  actor: {
    role: StaffRole;
    operatorId?: string;
    assignedOperatorId?: string | null;
    sharedQueue?: boolean;
  };
  providedAuditMetadata?: Partial<Record<RequiredAuditMetadata, unknown>>;
};

interface ActionDraft {
  id: StaffPortalActionId;
  targetType: StaffPortalTargetType;
  label: string;
  requiredRole?: StaffRole;
  lifecycleEnabled: boolean;
  lifecycleBlockedReason?: BlockedReason;
  staleReason?: StaleReason;
  consequence: string;
  remediationHint: string;
}

export function getAvailableActions(input: GetAvailableActionsInput): StaffActionDescriptor[] {
  const drafts = input.targetType === 'report'
    ? reportActionDrafts(input.state)
    : gateFindingActionDrafts(input.state);

  return drafts.map((draft) => toDescriptor(draft, input));
}

function reportActionDrafts(state: GovernedReportState): ActionDraft[] {
  const firstBlocked = state.blockedReasons[0];
  const staleReason = state.staleReasons[0];
  const reviewable = state.state === REPORT_STATES.GENERATED || state.state === REPORT_STATES.IN_REVIEW;

  return [
    {
      id: STAFF_ACTIONS.APPROVE_REPORT,
      targetType: 'report',
      label: 'Approve report',
      lifecycleEnabled: reviewable && state.artifactPresent && !firstBlocked && !staleReason,
      lifecycleBlockedReason: firstBlocked ?? (!state.artifactPresent ? BLOCKED_REASONS.MISSING_ARTIFACT : reviewable ? undefined : BLOCKED_REASONS.NOT_REVIEWABLE),
      staleReason,
      consequence: 'Marks the report as approved for later audited delivery.',
      remediationHint: 'Resolve blockers and complete approval evidence before approving.'
    },
    {
      id: STAFF_ACTIONS.REJECT_REPORT,
      targetType: 'report',
      label: 'Reject report',
      lifecycleEnabled: !state.approved && state.state !== REPORT_STATES.UNAVAILABLE && !staleReason,
      lifecycleBlockedReason: state.approved ? BLOCKED_REASONS.ALREADY_FINALIZED : state.state === REPORT_STATES.UNAVAILABLE ? BLOCKED_REASONS.NOT_REVIEWABLE : undefined,
      staleReason,
      consequence: 'Records that this report is not safe to deliver.',
      remediationHint: 'Add a rejection reason so the next operator understands the decision.'
    },
    {
      id: STAFF_ACTIONS.REQUEST_REGENERATION,
      targetType: 'report',
      label: 'Request regeneration',
      lifecycleEnabled: state.artifactPresent && !state.approved && !staleReason,
      lifecycleBlockedReason: state.approved ? BLOCKED_REASONS.ALREADY_FINALIZED : !state.artifactPresent ? BLOCKED_REASONS.MISSING_ARTIFACT : undefined,
      staleReason,
      consequence: 'Routes the report back for a new generated version.',
      remediationHint: 'Provide concise regeneration notes and reason code.'
    }
  ];
}

function gateFindingActionDrafts(state: GovernedGateFindingState): ActionDraft[] {
  const firstBlocked = state.blockedReasons[0];
  const staleReason = state.staleReasons[0];
  const open = state.state === GATE_FINDING_STATES.OPEN || state.state === GATE_FINDING_STATES.ESCALATED_FURTHER;

  return [
    {
      id: STAFF_ACTIONS.CLAIM_FINDING,
      targetType: 'gateFinding',
      label: 'Claim finding',
      lifecycleEnabled: open && !staleReason,
      lifecycleBlockedReason: open ? undefined : BLOCKED_REASONS.ALREADY_FINALIZED,
      staleReason,
      consequence: 'Assigns the finding to the current operator.',
      remediationHint: 'Claim before resolving when the item is in the shared queue.'
    },
    {
      id: STAFF_ACTIONS.RESOLVE_FINDING,
      targetType: 'gateFinding',
      label: 'Resolve finding',
      lifecycleEnabled: (open || state.state === GATE_FINDING_STATES.IN_REVIEW) && !firstBlocked && !staleReason,
      lifecycleBlockedReason: firstBlocked ?? (open || state.state === GATE_FINDING_STATES.IN_REVIEW ? undefined : BLOCKED_REASONS.ALREADY_FINALIZED),
      staleReason,
      consequence: 'Marks the gate finding resolved with audit evidence.',
      remediationHint: 'Attach a note and reason code before resolving.'
    },
    {
      id: STAFF_ACTIONS.OVERRIDE_FINDING,
      targetType: 'gateFinding',
      label: 'Override with reason',
      lifecycleEnabled: (open || state.state === GATE_FINDING_STATES.IN_REVIEW) && !staleReason,
      lifecycleBlockedReason: open || state.state === GATE_FINDING_STATES.IN_REVIEW ? undefined : BLOCKED_REASONS.ALREADY_FINALIZED,
      staleReason,
      consequence: 'Overrides the finding while preserving the reason for audit.',
      remediationHint: 'Use only when evidence supports overriding the gate finding.'
    },
    {
      id: STAFF_ACTIONS.ESCALATE_FINDING,
      targetType: 'gateFinding',
      label: 'Escalate finding',
      lifecycleEnabled: state.state !== GATE_FINDING_STATES.RESOLVED && !staleReason,
      lifecycleBlockedReason: state.state === GATE_FINDING_STATES.RESOLVED ? BLOCKED_REASONS.ALREADY_FINALIZED : undefined,
      staleReason,
      consequence: 'Keeps the finding open and routes it for additional review.',
      remediationHint: 'Explain what evidence or decision is still needed.'
    }
  ];
}

function toDescriptor(draft: ActionDraft, input: GetAvailableActionsInput): StaffActionDescriptor {
  const requiredAuditMetadata = ACTION_AUDIT_REQUIREMENTS[draft.id];
  const missingAuditMetadata = requiredAuditMetadata.some((key) => !input.providedAuditMetadata?.[key]);
  const hasScope = canActOnAssignedItem(input.actor);
  const blockedReason = !hasScope
    ? (input.actor.role === 'operator' ? BLOCKED_REASONS.NOT_ASSIGNED : BLOCKED_REASONS.PERMISSION_DENIED)
    : draft.lifecycleBlockedReason ?? (missingAuditMetadata ? BLOCKED_REASONS.AUDIT_METADATA_REQUIRED : undefined);

  return {
    id: draft.id,
    targetType: draft.targetType,
    label: draft.label,
    enabled: draft.lifecycleEnabled && hasScope && !missingAuditMetadata,
    requiredRole: draft.requiredRole ?? 'operator',
    blockedReason,
    staleReason: draft.staleReason,
    requiresReasonCode: ACTIONS_REQUIRING_REASON_CODE.has(draft.id),
    requiresNote: ACTIONS_REQUIRING_NOTE.has(draft.id),
    requiredAuditMetadata,
    testId: `staff-action-${draft.id}`,
    consequence: draft.consequence,
    remediationHint: blockedReason === BLOCKED_REASONS.AUDIT_METADATA_REQUIRED
      ? 'Complete the required audit metadata before submitting.'
      : draft.remediationHint
  };
}
