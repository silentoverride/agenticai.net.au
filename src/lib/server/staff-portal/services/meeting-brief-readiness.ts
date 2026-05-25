import type { AsyncDb } from '$lib/server/db';
import type { MeetingBriefState } from '$lib/staff-portal/dto';
import { MEETING_BRIEF_TRANSITIONS } from '../domain/meeting-brief-states';
import { REPORT_STATES } from '../domain/states';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MeetingBriefReadyValidation {
  allowed: boolean;
  blockedReason?: 'reportNotApproved';
  message?: string;
}

export interface MeetingBriefReadyInput {
  db: AsyncDb;
  meetingBriefId: string;
  linkedReportId: string | null;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * Validates whether a Meeting Brief can transition to 'ready'.
 *
 * Rules:
 * 1. The 'ready' transition must be allowed by the state machine
 * 2. If a linked report exists, it must be 'approved' — unless an
 *    exception reason is provided separately at the API layer
 */
export async function validateMeetingBriefReady(
  input: MeetingBriefReadyInput
): Promise<MeetingBriefReadyValidation> {
  const { db, meetingBriefId, linkedReportId } = input;

  // 1. Check state machine allows the ready transition
  // (actual current state is checked by the route calling this)

  // 2. Check linked report approval
  if (linkedReportId) {
    const report = await db.queryOne<{ status: string }>(
      `SELECT status FROM reports WHERE id = ? LIMIT 1`,
      linkedReportId
    );

    if (report && report.status !== REPORT_STATES.APPROVED) {
      return {
        allowed: false,
        blockedReason: 'reportNotApproved',
        message: 'The linked report must be "Approved" before the Meeting Brief can be marked ready. Use an exception reason if no approved deliverable is required.'
      };
    }
  }

  return { allowed: true };
}

/**
 * Checks if a status transition is allowed by the Meeting Brief state machine.
 */
export function isStatusTransitionAllowed(
  currentStatus: MeetingBriefState,
  targetStatus: MeetingBriefState
): boolean {
  const allowedTransitions = MEETING_BRIEF_TRANSITIONS[currentStatus];
  if (!allowedTransitions) return false;
  return allowedTransitions.includes(targetStatus);
}
