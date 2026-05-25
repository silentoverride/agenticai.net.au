import { describe, expect, it } from 'vitest';
import { createMemoryDb } from '../test-db';
import { validateMeetingBriefReady, isStatusTransitionAllowed } from '$lib/server/staff-portal/services/meeting-brief-readiness';
import { MEETING_BRIEF_STATUSES } from '$lib/server/staff-portal/domain/meeting-brief-states';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'generated',
    title TEXT
  );

  CREATE TABLE IF NOT EXISTS meeting_briefs (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    linked_report_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

describe('meeting-brief-readiness', () => {
  function makeDb(seed?: (s: import('better-sqlite3').Database) => void) {
    const { db, sqlite } = createMemoryDb(SCHEMA);
    if (seed) seed(sqlite);
    return { db, sqlite };
  }

  // -----------------------------------------------------------------------
  // validateMeetingBriefReady
  // -----------------------------------------------------------------------

  it('allows ready when no linked report', async () => {
    const { db } = makeDb();
    const result = await validateMeetingBriefReady({
      db,
      meetingBriefId: 'mb-001',
      linkedReportId: null
    });
    expect(result.allowed).toBe(true);
  });

  it('allows ready when linked report is approved', async () => {
    const { db } = makeDb((s) => {
      s.exec(`INSERT INTO reports (id, session_id, status, title) VALUES ('rpt-001', 'asst-001', 'approved', 'Test Report')`);
    });

    const result = await validateMeetingBriefReady({
      db,
      meetingBriefId: 'mb-001',
      linkedReportId: 'rpt-001'
    });
    expect(result.allowed).toBe(true);
  });

  it('blocks ready when linked report is not approved', async () => {
    const { db } = makeDb((s) => {
      s.exec(`INSERT INTO reports (id, session_id, status, title) VALUES ('rpt-002', 'asst-001', 'generated', 'Not Approved')`);
    });

    const result = await validateMeetingBriefReady({
      db,
      meetingBriefId: 'mb-001',
      linkedReportId: 'rpt-002'
    });
    expect(result.allowed).toBe(false);
    expect(result.blockedReason).toBe('reportNotApproved');
    expect(result.message).toContain('linked report');
  });

  it('allows ready when linked report does not exist in reports table', async () => {
    const { db } = makeDb();
    const result = await validateMeetingBriefReady({
      db,
      meetingBriefId: 'mb-001',
      linkedReportId: 'rpt-nonexistent'
    });
    expect(result.allowed).toBe(true);
  });

  // -----------------------------------------------------------------------
  // isStatusTransitionAllowed
  // -----------------------------------------------------------------------

  it('allows draft → ready transition', () => {
    expect(isStatusTransitionAllowed('draft', 'ready')).toBe(true);
  });

  it('allows draft → completed transition', () => {
    expect(isStatusTransitionAllowed('draft', 'completed')).toBe(true);
  });

  it('blocks completed → ready transition (terminal state)', () => {
    expect(isStatusTransitionAllowed('completed', 'ready')).toBe(false);
  });

  it('blocks completed → stale transition (terminal state)', () => {
    expect(isStatusTransitionAllowed('completed', 'stale')).toBe(false);
  });

  it('allows ready → stale transition', () => {
    expect(isStatusTransitionAllowed('ready', 'stale')).toBe(true);
  });

  it('allows ready → completed transition', () => {
    expect(isStatusTransitionAllowed('ready', 'completed')).toBe(true);
  });

  it('allows stale → ready transition (can revive)', () => {
    expect(isStatusTransitionAllowed('stale', 'ready')).toBe(true);
  });

  it('allows needsReview → draft transition', () => {
    expect(isStatusTransitionAllowed('needsReview', 'draft')).toBe(true);
  });

  it('blocks not_available (no transitions)', () => {
    expect(isStatusTransitionAllowed('not_available', 'draft')).toBe(false);
  });
});
