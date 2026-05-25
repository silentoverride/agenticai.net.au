import type { StaffMeetingBriefDto } from '$lib/staff-portal/dto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MeetingBriefStalenessWarning {
  stale: boolean;
  reason?: 'idleLongerThan30Days' | 'linkedReportChanged';
  message?: string;
  lastUpdated: string | null;
  daysSinceUpdate: number | null;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * Stale-trigger events in MVP:
 * - 30+ days since the Meeting Brief was last updated
 * - Linked report state changed after the brief was last updated
 *   (this is checked at the API layer via linkedReportId comparison)
 */

const STALE_THRESHOLD_DAYS = 30;

/**
 * Checks whether a Meeting Brief is stale based on idle time.
 *
 * Returns a warning when the brief has not been updated for 30+ days
 * and is not already in a terminal state.
 */
export function checkMeetingBriefStaleness(
  meetingBrief: StaffMeetingBriefDto
): MeetingBriefStalenessWarning {
  // Completed meeting briefs are not stale — they're done
  if (meetingBrief.status === 'completed') {
    return { stale: false, lastUpdated: null, daysSinceUpdate: null };
  }

  const updatedAt = new Date(meetingBrief.updatedAt);
  const now = new Date();
  const diffMs = now.getTime() - updatedAt.getTime();
  const daysSinceUpdate = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (daysSinceUpdate >= STALE_THRESHOLD_DAYS) {
    return {
      stale: true,
      reason: 'idleLongerThan30Days',
      message: `This Meeting Brief has not been updated in ${daysSinceUpdate} days. Review and refresh before use.`,
      lastUpdated: meetingBrief.updatedAt,
      daysSinceUpdate
    };
  }

  return { stale: false, lastUpdated: meetingBrief.updatedAt, daysSinceUpdate };
}
