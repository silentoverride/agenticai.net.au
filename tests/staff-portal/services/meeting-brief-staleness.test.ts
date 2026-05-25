import { describe, expect, it } from 'vitest';
import { checkMeetingBriefStaleness } from '$lib/server/staff-portal/services/meeting-brief-staleness';

describe('meeting-brief-staleness', () => {
  function makeBrief(overrides: Partial<{
    id: string;
    assessmentId: string;
    meetingDate: string | null;
    objective: string | null;
    talkingPoints: string | null;
    sensitiveIssues: string | null;
    offerNextStep: string | null;
    followUpIntention: string | null;
    finalAgendaNotes: string | null;
    prepChecklist: string | null;
    status: string;
    linkedReportId: string | null;
    createdAt: string;
    updatedAt: string;
  }> = {}) {
    const now = new Date();
    return {
      id: 'mb-001',
      assessmentId: 'asst-001',
      meetingDate: null,
      objective: null,
      talkingPoints: null,
      sensitiveIssues: null,
      offerNextStep: null,
      followUpIntention: null,
      finalAgendaNotes: null,
      prepChecklist: null,
      status: 'draft',
      linkedReportId: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      ...overrides
    };
  }

  // -----------------------------------------------------------------------
  // Fresh (recently updated)
  // -----------------------------------------------------------------------

  it('returns not stale for recently updated brief', () => {
    const brief = makeBrief();
    const result = checkMeetingBriefStaleness(brief);
    expect(result.stale).toBe(false);
    expect(result.daysSinceUpdate).toBe(0);
  });

  // -----------------------------------------------------------------------
  // Stale (30+ days idle)
  // -----------------------------------------------------------------------

  it('returns stale when brief is 31 days old', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 31);
    const brief = makeBrief({ updatedAt: oldDate.toISOString() });

    const result = checkMeetingBriefStaleness(brief);
    expect(result.stale).toBe(true);
    expect(result.reason).toBe('idleLongerThan30Days');
    expect(result.message).toContain('31 days');
    expect(result.daysSinceUpdate).toBe(31);
  });

  it('returns stale when brief is 60 days old', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 60);
    const brief = makeBrief({ updatedAt: oldDate.toISOString() });

    const result = checkMeetingBriefStaleness(brief);
    expect(result.stale).toBe(true);
    expect(result.daysSinceUpdate).toBe(60);
  });

  // -----------------------------------------------------------------------
  // Completed briefs are never stale
  // -----------------------------------------------------------------------

  it('returns not stale for completed briefs regardless of age', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 60);
    const brief = makeBrief({
      status: 'completed',
      updatedAt: oldDate.toISOString()
    });

    const result = checkMeetingBriefStaleness(brief);
    expect(result.stale).toBe(false);
  });

  // -----------------------------------------------------------------------
  // Under threshold (29 days)
  // -----------------------------------------------------------------------

  it('returns not stale at 29 days', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 29);
    const brief = makeBrief({ updatedAt: oldDate.toISOString() });

    const result = checkMeetingBriefStaleness(brief);
    expect(result.stale).toBe(false);
    expect(result.daysSinceUpdate).toBe(29);
  });
});
