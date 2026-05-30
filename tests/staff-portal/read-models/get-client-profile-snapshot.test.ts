import { describe, expect, it, beforeEach } from 'vitest';
import { createMemoryDb } from '../test-db';
import { getClientProfileSnapshot } from '$lib/server/staff-portal/read-models/get-client-profile-snapshot';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS pipeline_status (
    session_id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    deck_url TEXT,
    report_id TEXT,
    error TEXT,
    attempts INTEGER DEFAULT 0,
    call_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    r2_key TEXT,
    deck_url TEXT,
    title TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS assessment_orders (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    customer_name TEXT,
    company TEXT,
    journey_stage TEXT,
    risk_flags TEXT,
    value_flags TEXT,
    status TEXT DEFAULT 'paid',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS assessment_gates (
    gate_run_id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL,
    gate_type TEXT NOT NULL,
    verdict TEXT NOT NULL,
    confidence REAL DEFAULT 0.0,
    reasoning TEXT,
    details TEXT,
    model TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS human_assist_reviews (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL,
    gate_run_id TEXT,
    gate_type TEXT,
    status TEXT DEFAULT 'pending',
    staff_id TEXT,
    staff_notes TEXT,
    edited_content TEXT,
    reviewed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`;

describe('getClientProfileSnapshot', () => {
  function makeDb(seed?: (s: import('better-sqlite3').Database) => void) {
    const { db, sqlite } = createMemoryDb(SCHEMA);
    if (seed) seed(sqlite);
    return { db, sqlite };
  }

  // -----------------------------------------------------------------------
  // Populated profile with all fields
  // -----------------------------------------------------------------------

  it('returns a populated profile with all fields from existing data', async () => {
    const { db, sqlite } = makeDb((s) => {
      s.exec(`
        INSERT INTO pipeline_status (session_id, status, created_at, updated_at)
        VALUES ('asst-001', 'ready', '2026-05-01T00:00:00Z', '2026-05-02T00:00:00Z');

        INSERT INTO assessment_orders (id, session_id, customer_name, company, journey_stage, risk_flags, value_flags)
        VALUES ('order-1', 'asst-001', 'Acme Corp', 'Acme Pty Ltd', 'assessment_complete', '["high_priority"]', '["enterprise"]');

        INSERT INTO reports (id, session_id, r2_key, deck_url, title, created_at)
        VALUES ('rpt-1', 'asst-001', 'r2://reports/asst-001.pdf', 'https://deck.example.com', 'Assessment Report', '2026-05-02T00:00:00Z');
      `);
    });

    const result = await getClientProfileSnapshot({
      db,
      clientId: 'asst-001',
      actorId: 'admin-user',
      role: 'admin'
    });

    expect(result.hasData).toBe(true);
    expect(result.errorCode).toBeNull();
    expect(result.profile).not.toBeNull();
    expect(result.profile!.clientId).toBe('asst-001');
    expect(result.profile!.businessName).toBe('Acme Corp');
    expect(result.profile!.ownerName).toBe('');
    expect(result.profile!.journeyStage).toBe('assessment_complete');
    expect(result.profile!.riskFlags).toEqual(['high_priority']);
    expect(result.profile!.valueFlags).toEqual(['enterprise']);
    expect(result.profile!.reportState).toBe('generated');
    expect(result.profile!.humanReviewState).toBe('none');
    expect(result.profile!.meetingBriefState).toBe('not_available');
    expect(result.profile!.followUpState).toBe('not_available');
    expect(result.profile!.commercialNextStepStatus).toBe('not_available');
  });

  // -----------------------------------------------------------------------
  // Missing domain states return not_available
  // -----------------------------------------------------------------------

  it('returns not_available for follow-up, meeting brief, and commercial states', async () => {
    const { db, sqlite } = makeDb((s) => {
      s.exec(`
        INSERT INTO pipeline_status (session_id, status, created_at, updated_at)
        VALUES ('asst-002', 'ready', '2026-05-01T00:00:00Z', '2026-05-02T00:00:00Z');

        INSERT INTO assessment_orders (id, session_id, customer_name, company)
        VALUES ('order-2', 'asst-002', 'Beta Inc', 'Beta Pty Ltd');
      `);
    });

    const result = await getClientProfileSnapshot({
      db,
      clientId: 'asst-002',
      actorId: 'admin-user',
      role: 'admin'
    });

    expect(result.hasData).toBe(true);
    expect(result.profile!.meetingBriefState).toBe('not_available');
    expect(result.profile!.followUpState).toBe('not_available');
    expect(result.profile!.commercialNextStepStatus).toBe('not_available');
  });

  // -----------------------------------------------------------------------
  // Permission denied for staff on assigned item
  // -----------------------------------------------------------------------

  it('returns permission_denied for staff accessing another staff assigned item', async () => {
    const { db, sqlite } = makeDb((s) => {
      s.exec(`
        INSERT INTO pipeline_status (session_id, status, created_at, updated_at)
        VALUES ('asst-003', 'ready', '2026-05-01T00:00:00Z', '2026-05-02T00:00:00Z');

        INSERT INTO assessment_orders (id, session_id, customer_name, company)
        VALUES ('order-3', 'asst-003', 'Gamma LLC', 'Gamma LLC');

        INSERT INTO human_assist_reviews (id, assessment_id, status, staff_id)
        VALUES ('har-1', 'asst-003', 'in_review', 'staff-bob');
      `);
    });

    const result = await getClientProfileSnapshot({
      db,
      clientId: 'asst-003',
      actorId: 'staff-alice',
      role: 'staff'
    });

    expect(result.hasData).toBe(false);
    expect(result.errorCode).toBe('permission_denied');
    expect(result.profile).toBeNull();
  });

  // -----------------------------------------------------------------------
  // Operator can see unassigned (shared-queue) items
  // -----------------------------------------------------------------------

  it('allows staff to see unassigned shared-queue items', async () => {
    const { db, sqlite } = makeDb((s) => {
      s.exec(`
        INSERT INTO pipeline_status (session_id, status, created_at, updated_at)
        VALUES ('asst-004', 'ready', '2026-05-01T00:00:00Z', '2026-05-02T00:00:00Z');

        INSERT INTO assessment_orders (id, session_id, customer_name, company)
        VALUES ('order-4', 'asst-004', 'Delta Co', 'Delta Co');

        INSERT INTO reports (id, session_id, r2_key, deck_url, title, created_at)
        VALUES ('rpt-4', 'asst-004', 'r2://reports/asst-004.pdf', NULL, 'Assessment Report', '2026-05-02T00:00:00Z');
      `);
    });

    const result = await getClientProfileSnapshot({
      db,
      clientId: 'asst-004',
      actorId: 'staff-alice',
      role: 'staff'
    });

    expect(result.hasData).toBe(true);
    expect(result.errorCode).toBeNull();
    expect(result.profile!.clientId).toBe('asst-004');
  });

  // -----------------------------------------------------------------------
  // Admin can see all items regardless of assignment
  // -----------------------------------------------------------------------

  it('allows admin to see items assigned to another staff', async () => {
    const { db, sqlite } = makeDb((s) => {
      s.exec(`
        INSERT INTO pipeline_status (session_id, status, created_at, updated_at)
        VALUES ('asst-005', 'ready', '2026-05-01T00:00:00Z', '2026-05-02T00:00:00Z');

        INSERT INTO assessment_orders (id, session_id, customer_name, company)
        VALUES ('order-5', 'asst-005', 'Epsilon Ltd', 'Epsilon Ltd');

        INSERT INTO human_assist_reviews (id, assessment_id, status, staff_id)
        VALUES ('har-2', 'asst-005', 'in_review', 'staff-bob');
      `);
    });

    const result = await getClientProfileSnapshot({
      db,
      clientId: 'asst-005',
      actorId: 'admin-user',
      role: 'admin'
    });

    expect(result.hasData).toBe(true);
    expect(result.profile!.clientId).toBe('asst-005');
  });

  // -----------------------------------------------------------------------
  // Not found
  // -----------------------------------------------------------------------

  it('returns not_found for non-existent client', async () => {
    const { db } = makeDb();

    const result = await getClientProfileSnapshot({
      db,
      clientId: 'asst-nonexistent',
      actorId: 'admin-user',
      role: 'admin'
    });

    expect(result.hasData).toBe(false);
    expect(result.errorCode).toBe('not_found');
    expect(result.profile).toBeNull();
  });

  // -----------------------------------------------------------------------
  // Degraded data when fields are missing
  // -----------------------------------------------------------------------

  it('returns degraded when business name and artifact are missing', async () => {
    const { db, sqlite } = makeDb((s) => {
      s.exec(`
        INSERT INTO pipeline_status (session_id, status, created_at, updated_at)
        VALUES ('asst-006', 'ready', '2026-05-01T00:00:00Z', '2026-05-02T00:00:00Z');

        INSERT INTO assessment_orders (id, session_id, customer_name, company)
        VALUES ('order-6', 'asst-006', NULL, NULL);
      `);
    });

    const result = await getClientProfileSnapshot({
      db,
      clientId: 'asst-006',
      actorId: 'admin-user',
      role: 'admin'
    });

    expect(result.hasData).toBe(true);
    expect(result.errorCode).toBe('degraded');
    expect(result.degradedFields).toContain('businessName');
    expect(result.degradedFields).toContain('reportArtifact');
    // Falls back to "Unknown Business" when customer_name and company are null
    expect(result.profile!.businessName).toBe('Unknown Business');
  });

  // -----------------------------------------------------------------------
  // DTO shape — camelCase, serializable, no server imports
  // -----------------------------------------------------------------------

  it('returns DTO with all expected camelCase fields', async () => {
    const { db, sqlite } = makeDb((s) => {
      s.exec(`
        INSERT INTO pipeline_status (session_id, status, created_at, updated_at)
        VALUES ('asst-007', 'delayed', '2026-05-01T00:00:00Z', '2026-05-02T00:00:00Z');

        INSERT INTO assessment_orders (id, session_id, customer_name, company, risk_flags, value_flags)
        VALUES ('order-7', 'asst-007', 'Zeta Corp', 'Zeta Pty Ltd', '["urgent"]', '["vip"]');
      `);
    });

    const result = await getClientProfileSnapshot({
      db,
      clientId: 'asst-007',
      actorId: 'admin-user',
      role: 'admin'
    });

    const profile = result.profile!;
    const keys = Object.keys(profile).sort();
    expect(keys).toEqual([
      'businessName',
      'clientId',
      'commercialNextStepStatus',
      'followUpState',
      'humanReviewState',
      'journeyStage',
      'meetingBriefState',
      'ownerName',
      'reportState',
      'riskFlags',
      'valueFlags'
    ].sort());

    // Verify serializable (no functions, no undefined values)
    expect(() => JSON.stringify(profile)).not.toThrow();
    const serialized = JSON.parse(JSON.stringify(profile));
    expect(serialized.clientId).toBe('asst-007');
    expect(serialized.businessName).toBe('Zeta Corp');
  });

  // -----------------------------------------------------------------------
  // Report state mapping through brownfield mappers
  // -----------------------------------------------------------------------

  it('maps report state through brownfield mappers correctly', async () => {
    const { db, sqlite } = makeDb((s) => {
      s.exec(`
        INSERT INTO pipeline_status (session_id, status, created_at, updated_at)
        VALUES ('asst-008', 'human_assist', '2026-05-01T00:00:00Z', '2026-05-02T00:00:00Z');

        INSERT INTO assessment_orders (id, session_id, customer_name, company)
        VALUES ('order-8', 'asst-008', 'Eta Group', 'Eta Group');
      `);
    });

    const result = await getClientProfileSnapshot({
      db,
      clientId: 'asst-008',
      actorId: 'admin-user',
      role: 'admin'
    });

    // human_assist pipeline status maps to escalated report state
    expect(result.profile!.reportState).toBe('escalated');
  });

  // -----------------------------------------------------------------------
  // Human review state mapping
  // -----------------------------------------------------------------------

  it.each([
    ['pending', 'pending'],
    ['in_review', 'inReview'],
    ['approved', 'approved'],
    ['rejected', 'rejected'],
    ['edited', 'edited'],
    [null, 'none'],
    ['unknown', 'none']
  ])('maps human review status "%s" to "%s"', async (reviewStatus, expected) => {
    const { db, sqlite } = makeDb((s) => {
      s.exec(`
        INSERT INTO pipeline_status (session_id, status, created_at, updated_at)
        VALUES ('asst-009', 'ready', '2026-05-01T00:00:00Z', '2026-05-02T00:00:00Z');

        INSERT INTO assessment_orders (id, session_id, customer_name, company)
        VALUES ('order-9', 'asst-009', 'Theta Ltd', 'Theta Ltd');

        ${reviewStatus
          ? `INSERT INTO human_assist_reviews (id, assessment_id, status)
             VALUES ('har-9', 'asst-009', '${reviewStatus}');`
          : ''
        }
      `);
    });

    const result = await getClientProfileSnapshot({
      db,
      clientId: 'asst-009',
      actorId: 'admin-user',
      role: 'admin'
    });

    expect(result.profile!.humanReviewState).toBe(expected);
  });

  // -----------------------------------------------------------------------
  // Flag parsing edge cases
  // -----------------------------------------------------------------------

  it('handles null, empty, and malformed flag fields gracefully', async () => {
    const { db, sqlite } = makeDb((s) => {
      s.exec(`
        INSERT INTO pipeline_status (session_id, status, created_at, updated_at)
        VALUES ('asst-010', 'completed', '2026-05-01T00:00:00Z', '2026-05-02T00:00:00Z');

        INSERT INTO assessment_orders (id, session_id, customer_name, company, risk_flags, value_flags)
        VALUES ('order-10', 'asst-010', 'Iota Inc', 'Iota Inc', NULL, NULL);
      `);
    });

    const result = await getClientProfileSnapshot({
      db,
      clientId: 'asst-010',
      actorId: 'admin-user',
      role: 'admin'
    });

    expect(result.profile!.riskFlags).toEqual([]);
    expect(result.profile!.valueFlags).toEqual([]);
  });

  it('parses comma-separated flag strings', async () => {
    const { db, sqlite } = makeDb((s) => {
      s.exec(`
        INSERT INTO pipeline_status (session_id, status, created_at, updated_at)
        VALUES ('asst-011', 'ready', '2026-05-01T00:00:00Z', '2026-05-02T00:00:00Z');

        INSERT INTO assessment_orders (id, session_id, customer_name, company, risk_flags, value_flags)
        VALUES ('order-11', 'asst-011', 'Kappa LLC', 'Kappa LLC', 'high_priority,escalated', 'vip,long_term');
      `);
    });

    const result = await getClientProfileSnapshot({
      db,
      clientId: 'asst-011',
      actorId: 'admin-user',
      role: 'admin'
    });

    expect(result.profile!.riskFlags).toEqual(['high_priority', 'escalated']);
    expect(result.profile!.valueFlags).toEqual(['vip', 'long_term']);
  });

  // -----------------------------------------------------------------------
  // Lifecycle consistency — report state vocabulary matches Command Center
  // -----------------------------------------------------------------------

  it('uses consistent report state vocabulary with Command Center', async () => {
    const { db, sqlite } = makeDb((s) => {
      s.exec(`
        INSERT INTO pipeline_status (session_id, status, created_at, updated_at)
        VALUES ('asst-012', 'ready', '2026-05-01T00:00:00Z', '2026-05-02T00:00:00Z');

        INSERT INTO assessment_orders (id, session_id, customer_name, company)
        VALUES ('order-12', 'asst-012', 'Lambda Co', 'Lambda Co');

        INSERT INTO reports (id, session_id, r2_key, deck_url, title, created_at)
        VALUES ('rpt-12', 'asst-012', 'r2://reports/asst-012.pdf', NULL, 'Assessment Report', '2026-05-02T00:00:00Z');
      `);
    });

    const result = await getClientProfileSnapshot({
      db,
      clientId: 'asst-012',
      actorId: 'admin-user',
      role: 'admin'
    });

    // 'ready' pipeline status maps to 'generated' report state (not approved)
    expect(result.profile!.reportState).toBe('generated');
    expect(result.profile!.humanReviewState).toBe('none');
    // Both states are ReportState and HumanReviewState from dto.ts — same union
    // used by Command Center and Human Review
  });
});
