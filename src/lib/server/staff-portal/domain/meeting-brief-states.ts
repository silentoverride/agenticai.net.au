import type { MeetingBriefState } from '$lib/staff-portal/dto';

export const MEETING_BRIEF_STATUSES = {
  DRAFT: 'draft',
  NEEDS_REVIEW: 'needsReview',
  READY: 'ready',
  STALE: 'stale',
  COMPLETED: 'completed'
} as const satisfies Record<string, MeetingBriefState>;

/**
 * Valid Meeting Brief state transitions.
 * Key = current state, Value = allowed next states.
 */
export const MEETING_BRIEF_TRANSITIONS: Record<MeetingBriefState, MeetingBriefState[]> = {
  draft: ['needsReview', 'ready', 'completed'],
  needsReview: ['ready', 'completed', 'draft'],
  ready: ['completed', 'stale', 'draft'],
  stale: ['draft', 'needsReview', 'ready', 'completed'],
  completed: [],
  not_available: []
};

export interface MeetingBriefStateTransition {
  currentStatus: MeetingBriefState;
  allowedNextStatuses: MeetingBriefState[];
}

export function getMeetingBriefEligibility(
  currentStatus: MeetingBriefState
): MeetingBriefStateTransition {
  const allowedNextStatuses = MEETING_BRIEF_TRANSITIONS[currentStatus] ?? [];
  return { currentStatus, allowedNextStatuses };
}
