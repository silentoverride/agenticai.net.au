import { describe, expect, it } from 'vitest';
import { createMemoryDb } from '../test-db';
import {
  findMeetingBriefByAssessment,
  findMeetingBriefById,
  insertMeetingBrief,
  updateMeetingBrief
} from '$lib/server/staff-portal/repositories/meeting-brief.repository';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS meeting_briefs (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL,
    meeting_date TEXT,
    objective TEXT,
    talking_points TEXT,
    sensitive_issues TEXT,
    offer_next_step TEXT,
    follow_up_intention TEXT,
    final_agenda_notes TEXT,
    prep_checklist TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'needsReview', 'ready', 'stale', 'completed')),
    linked_report_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`;

describe('meeting-brief.repository', () => {
  function makeDb(seed?: (s: import('better-sqlite3').Database) => void) {
    const { db, sqlite } = createMemoryDb(SCHEMA);
    if (seed) seed(sqlite);
    return { db, sqlite };
  }

  // -----------------------------------------------------------------------
  // Insert
  // -----------------------------------------------------------------------

  it('inserts a meeting brief', async () => {
    const { db } = makeDb();

    const result = await insertMeetingBrief(db, {
      id: 'mb-001',
      assessmentId: 'asst-001',
      status: 'draft',
      objective: 'Review quarterly report',
      talkingPoints: 'Revenue growth, client retention',
      meetingDate: '2026-06-01'
    });

    expect(result.id).toBe('mb-001');
    expect(result.assessmentId).toBe('asst-001');
    expect(result.status).toBe('draft');
    expect(result.objective).toBe('Review quarterly report');
    expect(result.talkingPoints).toBe('Revenue growth, client retention');
    expect(result.meetingDate).toBe('2026-06-01');
    expect(result.createdAt).toBeTruthy();
    expect(result.updatedAt).toBeTruthy();
  });

  it('inserts a meeting brief with all optional fields', async () => {
    const { db } = makeDb();

    const result = await insertMeetingBrief(db, {
      id: 'mb-002',
      assessmentId: 'asst-001',
      status: 'ready',
      meetingDate: '2026-06-15',
      objective: 'Strategy session',
      talkingPoints: 'New market entry, competitive landscape',
      sensitiveIssues: 'Client concerned about pricing',
      offerNextStep: 'Propose tiered pricing model',
      followUpIntention: 'Send proposal by Friday',
      finalAgendaNotes: 'Introduce new team members',
      prepChecklist: 'Review market research, prepare slides',
      linkedReportId: 'rpt-001'
    });

    expect(result.id).toBe('mb-002');
    expect(result.status).toBe('ready');
    expect(result.sensitiveIssues).toBe('Client concerned about pricing');
    expect(result.offerNextStep).toBe('Propose tiered pricing model');
    expect(result.followUpIntention).toBe('Send proposal by Friday');
    expect(result.finalAgendaNotes).toBe('Introduce new team members');
    expect(result.prepChecklist).toBe('Review market research, prepare slides');
    expect(result.linkedReportId).toBe('rpt-001');
  });

  // -----------------------------------------------------------------------
  // Find
  // -----------------------------------------------------------------------

  it('finds meeting brief by assessment ID', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO meeting_briefs (id, assessment_id, status, objective)
        VALUES ('mb-003', 'asst-001', 'draft', 'Check-in');
      `);
    });

    const result = await findMeetingBriefByAssessment(db, 'asst-001');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('mb-003');
    expect(result!.objective).toBe('Check-in');
  });

  it('returns null for assessment with no meeting brief', async () => {
    const { db } = makeDb();
    const result = await findMeetingBriefByAssessment(db, 'asst-nonexistent');
    expect(result).toBeNull();
  });

  it('finds meeting brief by ID', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO meeting_briefs (id, assessment_id, status, objective)
        VALUES ('mb-004', 'asst-001', 'draft', 'Quarterly review');
      `);
    });

    const result = await findMeetingBriefById(db, 'mb-004');
    expect(result).not.toBeNull();
    expect(result!.objective).toBe('Quarterly review');
  });

  // -----------------------------------------------------------------------
  // Update
  // -----------------------------------------------------------------------

  it('updates meeting brief fields', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO meeting_briefs (id, assessment_id, status, objective)
        VALUES ('mb-005', 'asst-001', 'draft', 'Initial draft');
      `);
    });

    const result = await updateMeetingBrief(db, {
      id: 'mb-005',
      objective: 'Updated objective',
      status: 'needsReview',
      talkingPoints: 'New talking point'
    });

    expect(result).not.toBeNull();
    expect(result!.objective).toBe('Updated objective');
    expect(result!.status).toBe('needsReview');
    expect(result!.talkingPoints).toBe('New talking point');
  });

  it('updates only provided fields', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO meeting_briefs (id, assessment_id, status, objective, talking_points)
        VALUES ('mb-006', 'asst-001', 'draft', 'Original objective', 'Original talking point');
      `);
    });

    const result = await updateMeetingBrief(db, {
      id: 'mb-006',
      status: 'ready'
    });

    expect(result).not.toBeNull();
    expect(result!.status).toBe('ready');
    expect(result!.objective).toBe('Original objective');
    expect(result!.talkingPoints).toBe('Original talking point');
  });

  it('returns null when updating non-existent meeting brief', async () => {
    const { db } = makeDb();
    const result = await updateMeetingBrief(db, { id: 'mb-nonexistent', status: 'ready' });
    expect(result).toBeNull();
  });

  // -----------------------------------------------------------------------
  // Upsert pattern via API route logic
  // -----------------------------------------------------------------------

  it('supports upsert pattern — creates then returns existing', async () => {
    const { db } = makeDb();

    // Create
    const created = await insertMeetingBrief(db, {
      id: 'mb-007', assessmentId: 'asst-001', status: 'draft'
    });
    expect(created.status).toBe('draft');

    // Find should return same
    const found = await findMeetingBriefByAssessment(db, 'asst-001');
    expect(found!.id).toBe('mb-007');

    // Update in-place
    const updated = await updateMeetingBrief(db, {
      id: 'mb-007', status: 'ready', objective: 'Now ready'
    });
    expect(updated!.status).toBe('ready');
    expect(updated!.objective).toBe('Now ready');
  });

  // -----------------------------------------------------------------------
  // Calendly service (integration via site_settings)
  // -----------------------------------------------------------------------

  it('getCalendlyConfig returns link from site_settings', async () => {
    const { db } = makeDb((s) => {
      s.exec(`INSERT INTO site_settings (key, value) VALUES ('calendly_link', 'https://calendly.com/test-link')`);
    });

    // Dynamic import to test with the seeded db
    const { getCalendlyConfig } = await import('$lib/server/staff-portal/services/calendly.service');
    const config = await getCalendlyConfig(db);
    expect(config.calendlyLink).toBe('https://calendly.com/test-link');
  });

  it('getCalendlyConfig returns null when no link configured', async () => {
    const { db } = makeDb();  // no site_settings
    const { getCalendlyConfig } = await import('$lib/server/staff-portal/services/calendly.service');
    const config = await getCalendlyConfig(db);
    expect(config.calendlyLink).toBeNull();
  });
});
