import { describe, expect, it } from 'vitest';
import { createMemoryDb } from '../test-db';

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

  CREATE TABLE IF NOT EXISTS staff_action_audit_events (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    action TEXT NOT NULL,
    from_state TEXT,
    to_state TEXT,
    reason_code TEXT,
    reason TEXT,
    request_hash TEXT,
    idempotency_key TEXT,
    metadata_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

describe('meeting-brief API route', () => {
  it('GET returns null meeting brief for assessment with none', async () => {
    const { db } = createMemoryDb(SCHEMA);

    const { findMeetingBriefByAssessment } = await import(
      '$lib/server/staff-portal/repositories/meeting-brief.repository'
    );

    const result = await findMeetingBriefByAssessment(db, 'asst-nonexistent');
    expect(result).toBeNull();
  });

  it('PUT creates a new meeting brief with draft status', async () => {
    const { db, sqlite } = createMemoryDb(SCHEMA);

    const { insertMeetingBrief, findMeetingBriefByAssessment } = await import(
      '$lib/server/staff-portal/repositories/meeting-brief.repository'
    );

    const id = 'mb-new-001';
    await insertMeetingBrief(db, {
      id,
      assessmentId: 'asst-001',
      objective: 'Discuss Q3 roadmap',
      talkingPoints: 'Budget, timeline, team structure',
      status: 'draft'
    });

    const found = await findMeetingBriefByAssessment(db, 'asst-001');
    expect(found).not.toBeNull();
    expect(found!.status).toBe('draft');
    expect(found!.objective).toBe('Discuss Q3 roadmap');
    expect(found!.talkingPoints).toBe('Budget, timeline, team structure');
  });

  it('PUT updates an existing meeting brief', async () => {
    const { db, sqlite } = createMemoryDb(SCHEMA);

    const { insertMeetingBrief, updateMeetingBrief, findMeetingBriefByAssessment } = await import(
      '$lib/server/staff-portal/repositories/meeting-brief.repository'
    );

    await insertMeetingBrief(db, {
      id: 'mb-update-001',
      assessmentId: 'asst-update-001',
      status: 'draft'
    });

    await updateMeetingBrief(db, {
      id: 'mb-update-001',
      objective: 'Updated objective',
      status: 'ready'
    });

    const found = await findMeetingBriefByAssessment(db, 'asst-update-001');
    expect(found!.status).toBe('ready');
    expect(found!.objective).toBe('Updated objective');
  });

  it('rejects status transition from completed to draft (terminal state)', async () => {
    const { db, sqlite } = createMemoryDb(SCHEMA);

    const { insertMeetingBrief, findMeetingBriefByAssessment } = await import(
      '$lib/server/staff-portal/repositories/meeting-brief.repository'
    );

    await insertMeetingBrief(db, {
      id: 'mb-terminal-001',
      assessmentId: 'asst-terminal-001',
      status: 'completed'
    });

    const { isStatusTransitionAllowed } = await import(
      '$lib/server/staff-portal/services/meeting-brief-readiness'
    );

    const allowed = isStatusTransitionAllowed('completed', 'draft');
    expect(allowed).toBe(false);
  });

  it('allows stale → ready transition (can revive)', async () => {
    const { isStatusTransitionAllowed } = await import(
      '$lib/server/staff-portal/services/meeting-brief-readiness'
    );

    const allowed = isStatusTransitionAllowed('stale', 'ready');
    expect(allowed).toBe(true);
  });

  it('calendly config returns link from site_settings', async () => {
    const { db, sqlite } = createMemoryDb(SCHEMA);

    sqlite.exec(`INSERT INTO site_settings (key, value) VALUES ('calendly_link', 'https://calendly.com/acme-client')`);

    const { getCalendlyConfig } = await import(
      '$lib/server/staff-portal/services/calendly.service'
    );

    const config = await getCalendlyConfig(db);
    expect(config.calendlyLink).toBe('https://calendly.com/acme-client');
  });

  it('calendly config returns null when no site_settings row', async () => {
    const { db } = createMemoryDb(SCHEMA);

    const { getCalendlyConfig } = await import(
      '$lib/server/staff-portal/services/calendly.service'
    );

    const config = await getCalendlyConfig(db);
    expect(config.calendlyLink).toBeNull();
  });

  it('meeting brief DTO shape uses camelCase', async () => {
    const { db } = createMemoryDb(SCHEMA);

    const { insertMeetingBrief, findMeetingBriefByAssessment } = await import(
      '$lib/server/staff-portal/repositories/meeting-brief.repository'
    );

    await insertMeetingBrief(db, {
      id: 'mb-dto-001',
      assessmentId: 'asst-dto-001',
      meetingDate: '2026-06-15T10:00:00Z',
      objective: 'Contract review',
      talkingPoints: 'Milestones, payment schedule',
      sensitiveIssues: 'Budget constraints',
      offerNextStep: 'Revised terms',
      followUpIntention: 'Formal proposal',
      finalAgendaNotes: 'Focus on scope',
      prepChecklist: 'Review previous contract',
      status: 'draft'
    });

    const found = await findMeetingBriefByAssessment(db, 'asst-dto-001');
    expect(found).not.toBeNull();
    // All fields must be camelCase — no snake_case keys
    const keys = Object.keys(found!);
    expect(keys).toContain('meetingDate');
    expect(keys).toContain('talkingPoints');
    expect(keys).toContain('sensitiveIssues');
    expect(keys).toContain('offerNextStep');
    expect(keys).toContain('followUpIntention');
    expect(keys).toContain('finalAgendaNotes');
    expect(keys).toContain('prepChecklist');
    expect(keys).toContain('assessmentId');
    expect(keys).toContain('linkedReportId');
    // No snake_case leak
    expect(keys).not.toContain('meeting_date');
    expect(keys).not.toContain('talking_points');
  });
});
