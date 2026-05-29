import type { AsyncDb } from '$lib/server/db';
import type { CommercialNextStepStatus, StaffActionReceiptDto } from '$lib/staff-portal/dto';
import {
  insertStaffActionAuditEvent,
  findStaffActionAuditEventByIdempotency,
  staffActionReceiptFromEvent
} from '$lib/server/staff-portal/repositories/staff-audit.repository';
import { requiresConfirmation as requiresConfirmationCheck } from '$lib/staff-portal/commercial-utils';

/**
 * Records an audit event when a commercial next step's status or owner changes.
 *
 * Returns a receipt that includes the previous and resulting state.
 *
 * Idempotent: if an event with the same idempotencyKey already exists for this
 * actor+assessment, the existing receipt is returned without inserting a duplicate.
 */
export async function recordCommercialNextStepChange(
  db: AsyncDb,
  input: {
    assessmentId: string;
    commercialStepId: string;
    actorId: string;
    previousStatus: CommercialNextStepStatus;
    newStatus: CommercialNextStepStatus;
    previousOwner: string | null;
    newOwner: string | null;
    idempotencyKey: string;
    reason?: string | null;
  }
): Promise<StaffActionReceiptDto> {
  const idempCheck = await findStaffActionAuditEventByIdempotency(db, {
    actorId: input.actorId,
    assessmentId: input.assessmentId,
    idempotencyKey: input.idempotencyKey
  });

  if (idempCheck) {
    return staffActionReceiptFromEvent(idempCheck);
  }

  const statusChanged = input.previousStatus !== input.newStatus;
  const ownerChanged = input.previousOwner !== input.newOwner;

  // Build metadata with explicit change flags
  const metadata = {
    statusChanged,
    ownerChanged,
    previousStatus: input.previousStatus,
    newStatus: input.newStatus,
    previousOwner: input.previousOwner,
    newOwner: input.newOwner
  };

  // Build toState string that includes owner info when owner changed
  let toState = input.newStatus;
  if (ownerChanged && input.newOwner) {
    toState += `|owner:${input.newOwner}`;
  }

  let fromState = input.previousStatus;
  if (ownerChanged && input.previousOwner) {
    fromState += `|owner:${input.previousOwner}`;
  }

  const now = new Date().toISOString();
  const event = await insertStaffActionAuditEvent(db, {
    id: crypto.randomUUID(),
    assessmentId: input.assessmentId,
    targetType: 'commercialNextStep',
    targetId: input.commercialStepId,
    actorId: input.actorId,
    action: 'changeCommercialStep',
    fromState,
    toState,
    reasonCode: statusChanged ? 'status_change' : ownerChanged ? 'owner_change' : 'no_change',
    reason: input.reason ?? null,
    requestHash: '', // caller sets this if needed
    idempotencyKey: input.idempotencyKey,
    metadataJson: JSON.stringify(metadata),
    createdAt: now
  });

  return staffActionReceiptFromEvent(event);
}

/**
 * Determines whether a commercial next step change is "risky" and requires
 * a confirmation prompt.
 *
 * High risk changes:
 *  - Moving from any status to noAction (dropping intent)
 *  - Changing owner on a high-intent status
 */
export function requiresConfirmation(
  previousStatus: CommercialNextStepStatus,
  newStatus: CommercialNextStepStatus,
  previousOwner: string | null,
  newOwner: string | null
): boolean {
  return requiresConfirmationCheck(previousStatus, newStatus, previousOwner, newOwner);
}
