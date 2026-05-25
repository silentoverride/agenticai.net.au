/**
 * Client-safe utilities for commercial next step panel logic.
 * These are pure functions with no server-side dependencies.
 */

import type { CommercialNextStepStatus } from '$lib/staff-portal/dto';

/**
 * The set of commercial statuses that are considered "high intent"
 * and require follow-up continuity validation.
 */
const HIGH_INTENT_STATUSES: ReadonlySet<CommercialNextStepStatus> = new Set([
  'discussOffer',
  'sendFollowUp'
]);

/**
 * Returns true when the given status is a high-intent commercial status.
 */
export function isHighIntentStatus(status: CommercialNextStepStatus): boolean {
  return HIGH_INTENT_STATUSES.has(status);
}

/**
 * Determines whether a commercial next step change is "risky" and requires
 * a confirmation prompt before saving.
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
  // Dropping from an active/high-intent status to noAction
  if (previousStatus !== 'noAction' && newStatus === 'noAction') {
    return true;
  }
  // Changing owner while on a high-intent status
  const highIntent: ReadonlySet<CommercialNextStepStatus> = new Set(['discussOffer', 'sendFollowUp']);
  if (highIntent.has(previousStatus) && previousOwner !== newOwner) {
    return true;
  }
  return false;
}

/**
 * Validates whether a commercial next step save should proceed.
 *
 * When the target status is high intent (discussOffer | sendFollowUp), the caller
 * must either:
 *   a) provide a `followUpNote` explaining why no follow-up is needed, OR
 *   b) set `confirmedNoFollowUp: true` as an explicit acknowledgement
 *
 * Returns `null` on valid, or an error message string on invalid.
 */
export function validateFollowupContinuity(
  targetStatus: CommercialNextStepStatus,
  followUpNote: string | null | undefined,
  confirmedNoFollowUp: boolean | undefined
): string | null {
  if (!isHighIntentStatus(targetStatus)) {
    return null;
  }

  if (followUpNote && followUpNote.trim().length > 0) {
    return null;
  }

  if (confirmedNoFollowUp === true) {
    return null;
  }

  return (
    `Status "${targetStatus}" requires follow-up continuity. ` +
    'Either provide a note explaining why no follow-up is needed, ' +
    'or confirm that follow-up is not required.'
  );
}
