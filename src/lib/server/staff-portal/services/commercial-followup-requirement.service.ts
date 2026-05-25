import type { CommercialNextStepStatus } from '$lib/staff-portal/dto';
import { isHighIntentStatus, validateFollowupContinuity as validateFn } from '$lib/staff-portal/commercial-utils';

/**
 * Validates whether a commercial next step save should proceed.
 *
 * Delegates to the shared client-safe utility. Re-exported for server-side
 * route use.
 */
export function validateFollowupContinuity(
  targetStatus: CommercialNextStepStatus,
  followUpNote: string | null | undefined,
  confirmedNoFollowUp: boolean | undefined
): string | null {
  return validateFn(targetStatus, followUpNote, confirmedNoFollowUp);
}
