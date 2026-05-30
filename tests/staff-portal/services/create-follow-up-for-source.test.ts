import { describe, expect, it, beforeEach } from 'vitest';
import { createMemoryDb } from '../test-db';
import type { StaffFollowUpDto } from '$lib/staff-portal/dto';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS follow_ups (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    owner_id TEXT,
    due_date TEXT,
    source TEXT NOT NULL DEFAULT 'client_profile',
    status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'completed', 'deferred', 'reassigned')),
    client_visible_promise INTEGER NOT NULL DEFAULT 0,
    consequence_of_inaction TEXT,
    notes TEXT,
    linked_report_id TEXT,
    linked_gate_finding_id TEXT,
    linked_meeting_brief_id TEXT,
    linked_commercial_step_id TEXT,
    support_issue_ref TEXT,
    admin_task_ref TEXT,
    delayed_journey_state TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS staff_action_audit_events (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    actor_id TEXT NOT NULL,
    action TEXT NOT NULL,
    from_state TEXT NOT NULL,
    to_state TEXT NOT NULL,
    reason_code TEXT,
    reason TEXT,
    request_hash TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    metadata_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(actor_id, assessment_id, idempotency_key)
  );

  CREATE TABLE IF NOT EXISTS pipeline_status (
    session_id TEXT PRIMARY KEY,
    report_id TEXT,
    status TEXT,
    deck_url TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS human_assist_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assessment_id TEXT,
    status TEXT,
    staff_id TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    clerk_id TEXT PRIMARY KEY,
    role TEXT,
    name TEXT
  );
`;

describe('createFollowUpForSource service', () => {
  let db: ReturnType<typeof createMemoryDb>['db'];

  beforeEach(() => {
    const result = createMemoryDb(SCHEMA);
    db = result.db;
  });

  async function callService(input: {
    assessmentId: string;
    title: string;
    description?: string;
    ownerId?: string;
    dueDate?: string;
    source: string;
    clientVisiblePromise?: boolean;
    reportId?: string;
    gateFindingId?: string;
    meetingBriefId?: string;
    commercialStepId?: string;
  }) {
    const { createFollowUpForSource } = await import('$lib/server/staff-portal/services/create-follow-up-for-source');
    return createFollowUpForSource(db, {
      assessmentId: input.assessmentId,
      title: input.title,
      description: input.description,
      ownerId: input.ownerId,
      dueDate: input.dueDate,
      source: input.source as any,
      clientVisiblePromise: input.clientVisiblePromise,
      reportId: input.reportId,
      gateFindingId: input.gateFindingId,
      meetingBriefId: input.meetingBriefId,
      commercialStepId: input.commercialStepId
    });
  }

  // -----------------------------------------------------------------------
  // AC1: human_review source creates follow-up linked to report
  // -----------------------------------------------------------------------

  it('creates a follow-up with human_review source linked to a report', async () => {
    const result = await callService({
      assessmentId: 'asst-fu-src-001',
      title: 'Clarification needed on risk analysis',
      description: 'The risk score needs review by a senior staffer.',
      ownerId: 'op-001',
      source: 'human_review',
      reportId: 'rpt-001'
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    const fu = result.followUp;
    expect(fu.title).toBe('Clarification needed on risk analysis');
    expect(fu.source).toBe('human_review');
    expect(fu.linkedReportId).toBe('rpt-001');
    expect(fu.ownerId).toBe('op-001');
    expect(fu.assessmentId).toBe('asst-fu-src-001');
    expect(fu.status).toBe('open');
    expect(fu.clientVisiblePromise).toBe(false);
  });

  // -----------------------------------------------------------------------
  // AC2: meeting_brief source creates follow-up linked to meeting
  // -----------------------------------------------------------------------

  it('creates a follow-up with meeting_brief source linked to a meeting brief', async () => {
    const result = await callService({
      assessmentId: 'asst-fu-src-002',
      title: 'Send updated pricing to client',
      source: 'meeting_brief',
      meetingBriefId: 'mb-001',
      ownerId: 'op-002'
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    const fu = result.followUp;
    expect(fu.source).toBe('meeting_brief');
    expect(fu.linkedMeetingBriefId).toBe('mb-001');
    expect(fu.ownerId).toBe('op-002');
  });

  // -----------------------------------------------------------------------
  // AC2: commercial_next_step source creates follow-up
  // -----------------------------------------------------------------------

  it('creates a follow-up with commercial_next_step source', async () => {
    const result = await callService({
      assessmentId: 'asst-fu-src-003',
      title: 'Prepare proposal for Q3',
      source: 'commercial_next_step',
      commercialStepId: 'cs-001',
      ownerId: 'op-003',
      clientVisiblePromise: true
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    const fu = result.followUp;
    expect(fu.source).toBe('commercial_next_step');
    expect(fu.linkedCommercialStepId).toBe('cs-001');
    expect(fu.clientVisiblePromise).toBe(true);
  });

  // -----------------------------------------------------------------------
  // AC2: unsupported source returns validation error
  // -----------------------------------------------------------------------

  it('rejects unsupported source type with validation error', async () => {
    const result = await callService({
      assessmentId: 'asst-fu-src-004',
      title: 'Test',
      source: 'some_unknown_source'
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.code).toBe('unsupportedSource');
    expect(result.error.message).toContain('some_unknown_source');
  });

  // -----------------------------------------------------------------------
  // AC: human_review without report or gate finding fails validation
  // -----------------------------------------------------------------------

  it('rejects human_review source when no report or gate finding is linked', async () => {
    const result = await callService({
      assessmentId: 'asst-fu-src-005',
      title: 'Orphaned review follow-up',
      source: 'human_review',
      ownerId: 'op-004'
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.code).toBe('validationFailed');
    expect(result.error.message).toContain('report');
  });

  // -----------------------------------------------------------------------
  // AC: Follow-up from clarification-required on a report decision
  // -----------------------------------------------------------------------

  it('creates follow-up with gateFindingId link from human_review', async () => {
    const result = await callService({
      assessmentId: 'asst-fu-src-006',
      title: 'Review confidence on finding #42',
      source: 'human_review',
      gateFindingId: 'gf-042',
      ownerId: 'op-005'
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    const fu = result.followUp;
    expect(fu.source).toBe('human_review');
    expect(fu.linkedGateFindingId).toBe('gf-042');
    expect(fu.linkedReportId).toBeNull();
    expect(fu.linkedMeetingBriefId).toBeNull();
    expect(fu.linkedCommercialStepId).toBeNull();
  });

  // -----------------------------------------------------------------------
  // DTO consistency: created follow-up has expected camelCase shape
  // -----------------------------------------------------------------------

  it('returns follow-up with consistent camelCase DTO shape', async () => {
    const result = await callService({
      assessmentId: 'asst-fu-src-dto',
      title: 'DTO shape check',
      description: 'Testing DTO shape',
      ownerId: 'op-dto',
      dueDate: '2026-08-01',
      source: 'client_profile',
      clientVisiblePromise: true
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    const fu = result.followUp;
    const keys = Object.keys(fu);
    expect(keys).toContain('assessmentId');
    expect(keys).toContain('clientVisiblePromise');
    expect(keys).toContain('consequenceOfInaction');
    expect(keys).toContain('linkedReportId');
    expect(keys).toContain('createdAt');
    expect(keys).toContain('updatedAt');
    expect(keys).not.toContain('assessment_id');
    expect(keys).not.toContain('client_visible_promise');

    expect(fu.assessmentId).toBe('asst-fu-src-dto');
    expect(fu.title).toBe('DTO shape check');
    expect(fu.description).toBe('Testing DTO shape');
    expect(fu.ownerId).toBe('op-dto');
    expect(fu.source).toBe('client_profile');
    expect(fu.status).toBe('open');
    expect(fu.clientVisiblePromise).toBe(true);
  });
});

describe('Actions route — clarification-required creates follow-up', () => {
  let db: ReturnType<typeof createMemoryDb>['db'];

  beforeEach(() => {
    const result = createMemoryDb(SCHEMA);
    db = result.db;

    // Seed pipeline and human_assist data so loadCurrentTarget succeeds
    result.sqlite.exec(`
      INSERT INTO pipeline_status (session_id, report_id, status, deck_url, updated_at)
      VALUES ('asst-clar-001', 'rpt-clar', 'completed', 'https://deck.example.com', datetime('now'));

      INSERT INTO human_assist_reviews (assessment_id, status, staff_id, created_at)
      VALUES ('asst-clar-001', 'in_review', 'op-001', datetime('now'));

      INSERT INTO users (clerk_id, role, name)
      VALUES ('op-001', 'staff', 'Test Operator');
    `);
  });

  it('requestClarification action succeeds and follow-up is in DB', async () => {
    const { commitStaffAction } = await import('$lib/server/staff-portal/services/commit-staff-action');
    const { createFollowUpForSource } = await import('$lib/server/staff-portal/services/create-follow-up-for-source');

    // First, verify commitStaffAction succeeds for requestClarification
    const actionResult = await commitStaffAction({
      db: db,
      actorId: 'op-001',
      assessmentId: 'asst-clar-001',
      action: 'requestClarification',
      targetType: 'report',
      idempotencyKey: 'clar-idem-001',
      expectedState: 'inReview',
      reasonCode: 'additional_info_needed',
      reason: 'Need more details on financial projections'
    });

    expect(actionResult.success).toBe(true);
    if (!actionResult.success) return;
    expect(actionResult.state).toBe('clarificationRequired');
    expect(actionResult.receipt).toBeDefined();
    expect(actionResult.receipt!.action).toBe('requestClarification');

    // Now create a follow-up for this clarification (as the route would do)
    const fwResult = await createFollowUpForSource(db, {
      assessmentId: 'asst-clar-001',
      title: 'Clarification required — Need more details on financial projections',
      description: 'Auto-created from a Human Review decision. Need more details on financial projections.',
      ownerId: 'op-001',
      source: 'human_review',
      clientVisiblePromise: false,
      reportId: 'rpt-clar'
    });

    expect(fwResult.success).toBe(true);
    if (!fwResult.success) return;

    // Verify follow-up is persisted
    const { findFollowUpsByAssessment } = await import(
      '$lib/server/staff-portal/repositories/follow-up.repository'
    );
    const all = await findFollowUpsByAssessment(db, 'asst-clar-001');
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe('Clarification required — Need more details on financial projections');
    expect(all[0].linkedReportId).toBe('rpt-clar');
    expect(all[0].source).toBe('human_review');
    expect(all[0].status).toBe('open');
  });
});
