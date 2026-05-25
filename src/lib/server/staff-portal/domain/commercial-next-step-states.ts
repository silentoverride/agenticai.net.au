import type { CommercialNextStepStatus, CommercialDisplayState } from '$lib/staff-portal/dto';

export type { CommercialNextStepStatus, CommercialDisplayState };

export const COMMERCIAL_NEXT_STEP_STATUSES = {
  NO_ACTION: 'noAction',
  NURTURE: 'nurture',
  DISCUSS_OFFER: 'discussOffer',
  SEND_FOLLOW_UP: 'sendFollowUp',
  CREATE_FUTURE_OPPORTUNITY: 'createFutureOpportunity',
  NOT_AVAILABLE: 'not_available'
} as const satisfies Record<string, CommercialNextStepStatus>;

export const COMMERCIAL_DISPLAY_STATES = {
  MISSING: 'missing',
  DRAFT: 'draft',
  ACTIVE: 'active',
  NEEDS_FOLLOW_UP: 'needsFollowUp',
  COMPLETED: 'completed',
  DEFERRED: 'deferred',
  CANCELLED: 'cancelled',
  STALE: 'stale'
} as const satisfies Record<string, CommercialDisplayState>;

function statusToDisplayState(
  status: CommercialNextStepStatus,
  updatedAt: string,
  staleAfterDays = 30
): CommercialDisplayState {
  if (status === 'not_available') return 'missing';

  // Check staleness
  const updated = new Date(updatedAt);
  const now = new Date();
  const daysSinceUpdate = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceUpdate > staleAfterDays) return 'stale';

  const map: Record<string, CommercialDisplayState> = {
    noAction: 'draft',
    nurture: 'active',
    discussOffer: 'active',
    sendFollowUp: 'needsFollowUp',
    createFutureOpportunity: 'deferred'
  };

  return map[status] ?? 'active';
}

export { statusToDisplayState };
