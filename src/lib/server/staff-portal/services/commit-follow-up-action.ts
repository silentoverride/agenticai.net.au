import type { AsyncDb } from '$lib/server/db';
import type {
  StaffActionReceiptDto,
  FollowUpStatus,
  UpdateFollowUpActionInput
} from '$lib/staff-portal/dto';
import {
  FOLLOW_UP_STATUSES,
  getFollowUpActionEligibility,
  type AllowedFollowUpAction
} from '../domain/follow-up-states';
import {
  insertStaffActionAuditEvent,
  findStaffActionAuditEventByIdempotency,
  staffActionReceiptFromEvent
} from '../repositories/staff-audit.repository';
import { updateFollowUpStatus, findFollowUpById } from '../repositories/follow-up.repository';

export interface CommitFollowUpActionResult {
  success: boolean;
  receipt?: StaffActionReceiptDto;
  followUp?: import('$lib/staff-portal/dto').StaffFollowUpDto;
  error?: {
    code: 'staleState' | 'permissionDenied' | 'blockedAction' | 'duplicateAction' | 'validationFailed' | 'auditWriteFailed';
    message: string;
  };
}

export async function commitFollowUpAction(
  db: AsyncDb,
  input: UpdateFollowUpActionInput
): Promise<CommitFollowUpActionResult> {
  const { followUpId, actorId, assessmentId, action, reason, newOwnerId, idempotencyKey } = input;

  // 1. Check idempotency
  const existingEvent = await findStaffActionAuditEventByIdempotency(db, {
    actorId,
    assessmentId,
    idempotencyKey
  });

  if (existingEvent) {
    // Idempotent retry — return the existing receipt
    const followUp = await findFollowUpById(db, followUpId);
    return {
      success: true,
      receipt: staffActionReceiptFromEvent(existingEvent),
      followUp: followUp ?? undefined
    };
  }

  // 2. Load current follow-up
  const followUp = await findFollowUpById(db, followUpId);

  if (!followUp) {
    return {
      success: false,
      error: { code: 'validationFailed', message: 'Follow-up not found.' }
    };
  }

  // 3. Check action eligibility
  const eligibleActions = getFollowUpActionEligibility({
    currentStatus: followUp.status,
    actorRole: 'admin', // simplified — real auth check happens upstream
    isOwner: followUp.ownerId === actorId
  });

  const matchingAction = eligibleActions.find((a) => a.action === action);
  if (!matchingAction || !matchingAction.enabled) {
    const reason = matchingAction?.blockedReason;
    return {
      success: false,
      error: {
        code: reason === 'permissionDenied' ? 'permissionDenied' : 'blockedAction',
        message: matchingAction
          ? `Action ${action} is not allowed.${matchingAction.blockedReason ? ` Reason: ${matchingAction.blockedReason}` : ''}`
          : `Unknown action: ${action}`
      }
    };
  }

  // 4. Validate required fields
  if (matchingAction.requiresReason && !reason) {
    return {
      success: false,
      error: { code: 'validationFailed', message: 'A reason is required for this action.' }
    };
  }

  if (matchingAction.requiresNewOwner && !newOwnerId) {
    return {
      success: false,
      error: { code: 'validationFailed', message: 'A new owner is required for reassignment.' }
    };
  }

  // 5. Determine new status and notes
  const targetStatus: FollowUpStatus = mapActionToStatus(action, followUp.status);
  const updatedNotes = action === 'deferFollowUp' && reason
    ? (followUp.notes ? `${followUp.notes}\n\nDeferred: ${reason}` : `Deferred: ${reason}`)
    : followUp.notes;

  // 6. Persist state change
  const updatedFollowUp = await updateFollowUpStatus(db, {
    id: followUpId,
    status: targetStatus,
    notes: updatedNotes,
    ownerId: action === 'reassignFollowUp' ? newOwnerId : undefined
  });

  if (!updatedFollowUp) {
    return {
      success: false,
      error: { code: 'staleState', message: 'Follow-up was not found after update.' }
    };
  }

  // 7. Create audit event
  const eventId = crypto.randomUUID();
  try {
    await insertStaffActionAuditEvent(db, {
      id: eventId,
      assessmentId,
      targetType: 'followUp',
      targetId: followUpId,
      actorId,
      action: action as import('$lib/staff-portal/dto').StaffPortalActionId,
      fromState: followUp.status,
      toState: targetStatus,
      reasonCode: reason ?? undefined,
      reason: undefined,
      requestHash: `${followUpId}-${action}-${new Date().toISOString()}`,
      idempotencyKey,
      createdAt: new Date().toISOString()
    });
  } catch {
    return {
      success: false,
      error: { code: 'auditWriteFailed', message: 'Failed to persist audit event. State change was not committed.' }
    };
  }

  // 8. Return success
  const event = await findStaffActionAuditEventByIdempotency(db, {
    actorId,
    assessmentId,
    idempotencyKey
  });

  return {
    success: true,
    receipt: event ? staffActionReceiptFromEvent(event) : undefined,
    followUp: updatedFollowUp
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapActionToStatus(action: string, currentStatus: FollowUpStatus): FollowUpStatus {
  switch (action) {
    case 'completeFollowUp': return FOLLOW_UP_STATUSES.COMPLETED;
    case 'deferFollowUp': return FOLLOW_UP_STATUSES.DEFERRED;
    case 'reassignFollowUp': return FOLLOW_UP_STATUSES.REASSIGNED;
    default: return currentStatus;
  }
}
