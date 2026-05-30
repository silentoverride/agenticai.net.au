import type { FollowUpStatus } from '$lib/staff-portal/dto';
import { BLOCKED_REASONS, type BlockedReason } from './states';

export type { FollowUpStatus, BlockedReason };

export const FOLLOW_UP_STATUSES = {
  OPEN: 'open',
  COMPLETED: 'completed',
  DEFERRED: 'deferred',
  REASSIGNED: 'reassigned'
} as const satisfies Record<string, FollowUpStatus>;

/**
 * Valid Follow-up state transitions.
 * Key = current state, Value = allowed next states.
 */
export const FOLLOW_UP_TRANSITIONS: Record<FollowUpStatus, FollowUpStatus[]> = {
  open: ['completed', 'deferred', 'reassigned'],
  completed: [],           // terminal state
  deferred: ['open', 'completed'],  // can be re-opened or completed
  reassigned: ['open', 'completed'] // new owner can open or complete
};

export interface GovernedFollowUpState {
  status: FollowUpStatus;
  blockedReasons: BlockedReason[];
}

export interface GetFollowUpActionEligibilityInput {
  currentStatus: FollowUpStatus;
  actorRole: 'admin' | 'staff';
  isOwner: boolean;
}

export interface AllowedFollowUpAction {
  action: 'completeFollowUp' | 'deferFollowUp' | 'reassignFollowUp';
  label: string;
  enabled: boolean;
  blockedReason?: BlockedReason;
  requiresReason: boolean;
  requiresNewOwner: boolean;
  remediationHint?: string;
}

export function getFollowUpActionEligibility(
  input: GetFollowUpActionEligibilityInput
): AllowedFollowUpAction[] {
  const { currentStatus, actorRole, isOwner } = input;
  const allowedNextStates = FOLLOW_UP_TRANSITIONS[currentStatus] ?? [];

  const completeAction = buildAction({
    action: 'completeFollowUp',
    label: 'Complete Follow-up',
    currentStatus,
    allowedNextStates,
    allowed: allowedNextStates.includes('completed'),
    requiredNextState: 'completed',
    actorRole,
    isOwner,
    requiresReason: false,
    requiresNewOwner: false
  });

  const deferAction = buildAction({
    action: 'deferFollowUp',
    label: 'Defer Follow-up',
    currentStatus,
    allowedNextStates,
    allowed: allowedNextStates.includes('deferred'),
    requiredNextState: 'deferred',
    actorRole,
    isOwner,
    requiresReason: true,
    requiresNewOwner: false
  });

  const reassignAction = buildAction({
    action: 'reassignFollowUp',
    label: 'Reassign Follow-up',
    currentStatus,
    allowedNextStates,
    allowed: allowedNextStates.includes('reassigned'),
    requiredNextState: 'reassigned',
    actorRole,
    isOwner,
    requiresReason: false,
    requiresNewOwner: true
  });

  return [completeAction, deferAction, reassignAction].filter((a) => a);
}

function buildAction(opts: {
  action: 'completeFollowUp' | 'deferFollowUp' | 'reassignFollowUp';
  label: string;
  currentStatus: FollowUpStatus;
  allowedNextStates: FollowUpStatus[];
  allowed: boolean;
  requiredNextState: FollowUpStatus;
  actorRole: 'admin' | 'staff';
  isOwner: boolean;
  requiresReason: boolean;
  requiresNewOwner: boolean;
}): AllowedFollowUpAction {
  const { action, label, allowed, actorRole, isOwner } = opts;
  let blockedReason: BlockedReason | undefined;

  if (!allowed) {
    blockedReason = BLOCKED_REASONS.ALREADY_FINALIZED;
  } else if (actorRole !== 'admin' && !isOwner) {
    blockedReason = BLOCKED_REASONS.PERMISSION_DENIED;
  }

  return {
    action,
    label,
    enabled: !blockedReason,
    blockedReason,
    requiresReason: opts.requiresReason,
    requiresNewOwner: opts.requiresNewOwner,
    remediationHint: remediationForBlockedReason(blockedReason)
  };
}

function remediationForBlockedReason(reason?: BlockedReason): string | undefined {
  switch (reason) {
    case BLOCKED_REASONS.ALREADY_FINALIZED:
      return 'This follow-up has already reached a terminal state. No further action is available.';
    case BLOCKED_REASONS.PERMISSION_DENIED:
      return 'Only the assigned owner or an admin can modify this follow-up.';
    default:
      return undefined;
  }
}
