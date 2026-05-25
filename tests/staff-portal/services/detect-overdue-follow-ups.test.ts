import { describe, expect, it, beforeEach, beforeAll } from 'vitest';
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
    affected_entity TEXT,
    metadata_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS staff_activity_events (
    id TEXT PRIMARY KEY,
    assessment_id TEXT,
    summary TEXT,
    source_domain TEXT,
    actor TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`;

describe('detectOverdueFollowUps', () => {
  let db: ReturnType<typeof createMemoryDb>['db'];

  beforeEach(() => {
    const result = createMemoryDb(SCHEMA);
    db = result.db;
  });

  async function callService(assessmentId?: string) {
    const { detectOverdueFollowUps } = await import(
      '$lib/server/staff-portal/services/detect-overdue-follow-ups'
    );
    return detectOverdueFollowUps({
      db: db as any,
      ...(assessmentId ? { assessmentId } : {})
    });
  }

  // Helper to insert a follow-up with a specific due date
  async function insertFollowUp(overrides: {
    id: string;
    assessmentId: string;
    title?: string;
    ownerId?: string;
    dueDate: string;       // e.g. '2024-01-01' (in the past) or far future
    clientVisiblePromise?: boolean;
    consequenceOfInaction?: string;
    status?: string;
  }) {
    await db.exec(
      `INSERT INTO follow_ups (
        id, assessment_id, title, owner_id, due_date, source, status,
        client_visible_promise, consequence_of_inaction
      ) VALUES (?, ?, ?, ?, ?, 'human_review', ?, ?, ?)`,
      overrides.id,
      overrides.assessmentId,
      overrides.title ?? 'Test follow-up',
      overrides.ownerId ?? null,
      overrides.dueDate,
      overrides.status ?? 'open',
      overrides.clientVisiblePromise ? 1 : 0,
      overrides.consequenceOfInaction ?? null
    );
  }

  // -----------------------------------------------------------------------
  // AC1: Detects overdue client-visible follow-ups
  // -----------------------------------------------------------------------

  it('detects overdue client-visible follow-ups and creates audit events', async () => {
    await insertFollowUp({
      id: 'fu-overdue-1',
      assessmentId: 'asst-001',
      title: 'Send proposal',
      dueDate: '2024-01-15',
      clientVisiblePromise: true,
      consequenceOfInaction: 'Client may lose confidence.'
    });

    const result = await callService();

    expect(result.newlyMarkedOverdue).toEqual(['fu-overdue-1']);
    expect(result.alreadyKnownOverdue).toEqual([]);
    expect(result.errors).toEqual([]);

    // Verify audit event was created
    const events = await db.queryAll<any>(
      "SELECT * FROM staff_action_audit_events WHERE action = 'first_overdue'"
    );
    expect(events).toHaveLength(1);
    expect(events[0].target_id).toBe('fu-overdue-1');
    expect(events[0].actor_id).toBe('system');
    expect(events[0].reason).toContain('Send proposal');
    expect(events[0].reason).toContain('Client may lose confidence');
  });

  // -----------------------------------------------------------------------
  // AC2: Non-client-visible overdue follow-ups create activity entries
  // -----------------------------------------------------------------------

  it('creates activity entries for overdue non-client-visible follow-ups', async () => {
    await insertFollowUp({
      id: 'fu-overdue-2',
      assessmentId: 'asst-001',
      title: 'Internal review note',
      dueDate: '2024-02-01',
      clientVisiblePromise: false,
      consequenceOfInaction: 'Internal process may stall.'
    });

    const result = await callService();

    expect(result.newlyMarkedOverdue).toEqual(['fu-overdue-2']);

    // Verify activity event, not audit event
    const auditEvents = await db.queryAll<any>(
      "SELECT * FROM staff_action_audit_events WHERE action = 'first_overdue'"
    );
    expect(auditEvents).toHaveLength(0);

    const activityEvents = await db.queryAll<any>(
      'SELECT * FROM staff_activity_events'
    );
    expect(activityEvents).toHaveLength(1);
    expect(activityEvents[0].summary).toContain('Internal review note');
    expect(activityEvents[0].source_domain).toBe('follow_up');
  });

  // -----------------------------------------------------------------------
  // AC3: Idempotent — doesn't double-create audit events
  // -----------------------------------------------------------------------

  it('does not create duplicate audit events for already-detected overdue follow-ups', async () => {
    await insertFollowUp({
      id: 'fu-overdue-3',
      assessmentId: 'asst-001',
      dueDate: '2024-03-01',
      clientVisiblePromise: true
    });

    // First detection
    const first = await callService();
    expect(first.newlyMarkedOverdue).toEqual(['fu-overdue-3']);

    // Second detection — same follow-up, already detected
    const second = await callService();
    expect(second.newlyMarkedOverdue).toEqual([]);
    expect(second.alreadyKnownOverdue).toEqual(['fu-overdue-3']);

    // Only one audit event
    const events = await db.queryAll<any>(
      "SELECT * FROM staff_action_audit_events WHERE action = 'first_overdue'"
    );
    expect(events).toHaveLength(1);
  });

  // -----------------------------------------------------------------------
  // AC4: Scoped to a single assessment when assessmentId provided
  // -----------------------------------------------------------------------

  it('only detects overdue follow-ups for the specified assessment', async () => {
    await insertFollowUp({
      id: 'fu-overdue-4a',
      assessmentId: 'asst-a',
      dueDate: '2024-01-01',
      clientVisiblePromise: true
    });
    await insertFollowUp({
      id: 'fu-overdue-4b',
      assessmentId: 'asst-b',
      dueDate: '2024-01-01',
      clientVisiblePromise: true
    });

    const result = await callService('asst-a');

    expect(result.newlyMarkedOverdue).toEqual(['fu-overdue-4a']);
    expect(result.alreadyKnownOverdue).toEqual([]);
  });

  // -----------------------------------------------------------------------
  // AC5: Returns empty when no overdue follow-ups exist
  // -----------------------------------------------------------------------

  it('returns empty when no overdue follow-ups exist', async () => {
    await insertFollowUp({
      id: 'fu-future',
      assessmentId: 'asst-001',
      dueDate: '2099-12-31',   // far future
      clientVisiblePromise: true
    });

    const result = await callService();
    expect(result.newlyMarkedOverdue).toEqual([]);
    expect(result.alreadyKnownOverdue).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  // -----------------------------------------------------------------------
  // AC6: Ignores completed follow-ups even if past due
  // -----------------------------------------------------------------------

  it('ignores completed follow-ups even if past due', async () => {
    await insertFollowUp({
      id: 'fu-completed-overdue',
      assessmentId: 'asst-001',
      dueDate: '2024-01-01',
      clientVisiblePromise: true,
      status: 'completed'
    });

    const result = await callService();
    expect(result.newlyMarkedOverdue).toEqual([]);
    expect(result.alreadyKnownOverdue).toEqual([]);
  });

  // -----------------------------------------------------------------------
  // AC7: Overdue detection with DTO shape
  // -----------------------------------------------------------------------

  it('returns a clean result DTO', async () => {
    const result = await callService();
    expect(result).toHaveProperty('newlyMarkedOverdue');
    expect(result).toHaveProperty('alreadyKnownOverdue');
    expect(result).toHaveProperty('errors');
    expect(Array.isArray(result.newlyMarkedOverdue)).toBe(true);
    expect(Array.isArray(result.alreadyKnownOverdue)).toBe(true);
    expect(Array.isArray(result.errors)).toBe(true);
  });
});

import { describe, expect, it, beforeAll } from 'vitest';
import { deriveWhatMattersNow } from '$lib/server/staff-portal/read-models/derive-what-matters-now';

describe('deriveWhatMattersNow with overdue follow-ups', () => {
  const baseProfile = {
    clientId: 'asst-001',
    businessName: 'Test Co',
    ownerName: 'Op One',
    journeyStage: 'active',
    riskFlags: [],
    valueFlags: [],
    reportState: 'approved' as const,
    humanReviewState: 'approved' as const,
    meetingBriefState: 'not_available' as const,
    followUpState: 'open' as const,
    commercialNextStepStatus: 'not_available' as const
  };

  const baseFollowUp: StaffFollowUpDto = {
    id: 'fu-001',
    assessmentId: 'asst-001',
    title: 'Send updated terms',
    description: null,
    ownerId: 'op-001',
    dueDate: null,
    source: 'human_review',
    status: 'open',
    clientVisiblePromise: true,
    consequenceOfInaction: 'Client may renegotiate.',
    notes: null,
    linkedReportId: null,
    linkedGateFindingId: null,
    linkedMeetingBriefId: null,
    linkedCommercialStepId: null,
    supportIssueRef: null,
    adminTaskRef: null,
    delayedJourneyState: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01'
  };

  it('shows overdue follow-up details when follow-up is past due', () => {
    const overdueFu: StaffFollowUpDto = {
      ...baseFollowUp,
      dueDate: '2024-06-01'  // clearly in the past
    };

    const result = deriveWhatMattersNow({
      profile: baseProfile,
      mostUrgentFollowUp: overdueFu
    });

    expect(result.primaryTreatment).toBe('at_risk');
    expect(result.blocker.blockerName).toContain('Overdue');
    expect(result.blocker.blockerName).toContain('Send updated terms');
    expect(result.dueDate).toBe('2024-06-01');
    expect(result.ownerName).toBe('op-001');
    expect(result.consequenceOfInaction).toContain('renegotiate');
    expect(result.sourceDomain).toBe('follow_up');
  });

  it('shows due-soon follow-up details when due within 7 days', () => {
    // Compute a date 3 days from now
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      .toISOString().slice(0, 10);

    const dueSoonFu: StaffFollowUpDto = {
      ...baseFollowUp,
      dueDate: threeDaysFromNow
    };

    const result = deriveWhatMattersNow({
      profile: baseProfile,
      mostUrgentFollowUp: dueSoonFu
    });

    expect(result.primaryTreatment).toBe('at_risk');
    expect(result.blocker.blockerName).toContain('Due soon');
    expect(result.blocker.blockerName).toContain('Send updated terms');
    expect(result.dueDate).toBe(threeDaysFromNow);
    expect(result.ownerName).toBe('op-001');
  });

  it('shows future-due follow-up details', () => {
    const futureFu: StaffFollowUpDto = {
      ...baseFollowUp,
      dueDate: '2099-12-31'  // far future
    };

    const result = deriveWhatMattersNow({
      profile: baseProfile,
      mostUrgentFollowUp: futureFu
    });

    expect(result.primaryTreatment).toBe('at_risk');
    expect(result.blocker.blockerName).toContain('Follow-up');
    expect(result.blocker.blockerName).toContain('Send updated terms');
    expect(result.dueDate).toBe('2099-12-31');
  });

  it('shows no-due-date follow-up with draft_stale treatment', () => {
    const noDueFu: StaffFollowUpDto = {
      ...baseFollowUp,
      dueDate: null
    };

    const result = deriveWhatMattersNow({
      profile: baseProfile,
      mostUrgentFollowUp: noDueFu
    });

    expect(result.primaryTreatment).toBe('draft_stale');
    expect(result.blocker.blockerName).toContain('Follow-up');
    expect(result.nextValidAction).toBe('Set due date');
    expect(result.dueDate).toBeNull();
  });

  it('falls back to generic message when no follow-up details provided', () => {
    const result = deriveWhatMattersNow({
      profile: baseProfile,
      mostUrgentFollowUp: null
    });

    expect(result.primaryTreatment).toBe('at_risk');
    expect(result.blocker.blockerName).toBe('Open follow-up items');
    expect(result.dueDate).toBeNull();
    // ownerName falls back to profile.ownerName when candidate doesn't specify one
    expect(result.ownerName).toBe('Op One');
  });

  it('still returns open follow-up message when mostUrgentFollowUp is omitted', () => {
    const result = deriveWhatMattersNow({
      profile: baseProfile
      // mostUrgentFollowUp omitted
    });

    expect(result.primaryTreatment).toBe('at_risk');
    expect(result.blocker.blockerName).toBe('Open follow-up items');
  });
});
