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
 * Returns true when the given status is a high-intent commercial status that
 * requires follow-up continuity (either a linked follow-up or a note explaining
 * why a follow-up is unnecessary).
 */
export function isHighIntentStatus(status: CommercialNextStepStatus): boolean {
  return HIGH_INTENT_STATUSES.has(status);
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
    return null; // low-intent statuses need no validation
  }

  // If the caller already has a follow-up explanation note, that's sufficient
  if (followUpNote && followUpNote.trim().length > 0) {
    return null;
  }

  // If the caller explicitly confirms "no follow-up needed", allow it
  if (confirmedNoFollowUp === true) {
    return null;
  }

  return (
    `Status "${targetStatus}" requires follow-up continuity. ` +
    'Either provide a note explaining why no follow-up is needed, ' +
    'or confirm that follow-up is not required.'
  );
}
