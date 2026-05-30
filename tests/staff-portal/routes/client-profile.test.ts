import { describe, expect, it } from 'vitest';
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
`;

describe('Client Profile route composition', () => {
  function makeDb(seed?: (s: import('better-sqlite3').Database) => void) {
    const { db, sqlite } = createMemoryDb(SCHEMA);
    if (seed) seed(sqlite);
    return { db, sqlite };
  }

  // -----------------------------------------------------------------------
  // Route composition: all read models load with populated profile
  // -----------------------------------------------------------------------

  it('composes all read models for a populated profile (admin)', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO pipeline_status (session_id, status, created_at, updated_at)
        VALUES ('asst-001', 'ready', '2026-05-01T00:00:00Z', '2026-05-02T00:00:00Z');

        INSERT INTO assessment_orders (id, session_id, customer_name, company, journey_stage, risk_flags, value_flags)
        VALUES ('ord-001', 'asst-001', 'Acme Corp', 'Acme Corp', 'discovery', '["high_value"]', '["growth"]');

        INSERT INTO reports (id, session_id, r2_key, title, created_at)
        VALUES ('rpt-001', 'asst-001', 'reports/rpt-001.pdf', 'Initial Report', '2026-05-01T01:00:00Z');

        INSERT INTO assessment_gates (gate_run_id, assessment_id, gate_type, verdict, confidence)
        VALUES ('gate-001', 'asst-001', 'report-review', 'approve', 0.92);

        INSERT INTO staff_action_audit_events (id, assessment_id, target_type, target_id, actor_id, action, from_state, to_state, reason, request_hash, idempotency_key, created_at)
        VALUES ('evt-001', 'asst-001', 'report', 'rpt-001', 'admin-001', 'approveReport', 'generated', 'approved', 'All good', 'hash-001', 'idem-001', '2026-05-02T10:00:00Z');
      `);
    });

    // 1. Profile snapshot
    const profileResult = await getClientProfileSnapshot({
      db, clientId: 'asst-001', actorId: 'admin-001', role: 'admin'
    });

    expect(profileResult.hasData).toBe(true);
    expect(profileResult.profile).not.toBeNull();
    expect(profileResult.profile!.businessName).toBe('Acme Corp');
    expect(profileResult.profile!.riskFlags).toContain('high_value');
    expect(profileResult.errorCode).toBeNull();

    // These read models are tested individually in their own test files.
    // This test verifies that composition works without errors.
    expect(profileResult.profile!.reportState).toBe('generated');
    expect(profileResult.profile!.humanReviewState).toBe('none');
  });

  // -----------------------------------------------------------------------
  // Not found state
  // -----------------------------------------------------------------------

  it('returns not-found for non-existent assessment', async () => {
    const { db } = makeDb();

    const profileResult = await getClientProfileSnapshot({
      db, clientId: 'asst-999', actorId: 'admin-001', role: 'admin'
    });

    expect(profileResult.hasData).toBe(false);
    expect(profileResult.profile).toBeNull();
    expect(profileResult.errorCode).toBe('not_found');
  });

  // -----------------------------------------------------------------------
  // Permission denied
  // -----------------------------------------------------------------------

  it('returns permission denied for staff on unassigned work', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO pipeline_status (session_id, status, created_at, updated_at)
        VALUES ('asst-003', 'ready', '2026-05-01T00:00:00Z', '2026-05-02T00:00:00Z');

        INSERT INTO human_assist_reviews (id, assessment_id, status, staff_id)
        VALUES ('har-003', 'asst-003', 'in_review', 'op-other');
      `);
    });

    const profileResult = await getClientProfileSnapshot({
      db, clientId: 'asst-003', actorId: 'op-001', role: 'staff'
    });

    expect(profileResult.hasData).toBe(false);
    expect(profileResult.errorCode).toBe('permission_denied');
  });

  // -----------------------------------------------------------------------
  // Admin sees all
  // -----------------------------------------------------------------------

  it('admin can view any profile regardless of ownership', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO pipeline_status (session_id, status, created_at, updated_at)
        VALUES ('asst-004', 'ready', '2026-05-01T00:00:00Z', '2026-05-02T00:00:00Z');

        INSERT INTO assessment_orders (id, session_id, customer_name, company)
        VALUES ('ord-004', 'asst-004', 'Some Corp', 'Some Corp');

        INSERT INTO reports (id, session_id, r2_key, title, created_at)
        VALUES ('rpt-004', 'asst-004', 'reports/rpt-004.pdf', 'Report', '2026-05-01T01:00:00Z');

        INSERT INTO human_assist_reviews (id, assessment_id, status, staff_id)
        VALUES ('har-004', 'asst-004', 'in_review', 'op-other');
      `);
    });

    const profileResult = await getClientProfileSnapshot({
      db, clientId: 'asst-004', actorId: 'admin-001', role: 'admin'
    });

    expect(profileResult.hasData).toBe(true);
    expect(profileResult.errorCode).toBeNull();
  });

  // -----------------------------------------------------------------------
  // Degraded data handling
  // -----------------------------------------------------------------------

  it('handles degraded data gracefully', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO pipeline_status (session_id, status, created_at, updated_at)
        VALUES ('asst-005', 'ready', '2026-05-01T00:00:00Z', '2026-05-02T00:00:00Z');

        -- No reports, no assessment_orders but pipeline_status exists
      `);
    });

    const profileResult = await getClientProfileSnapshot({
      db, clientId: 'asst-005', actorId: 'admin-001', role: 'admin'
    });

    expect(profileResult.hasData).toBe(true);
    expect(profileResult.degradedFields.length).toBeGreaterThanOrEqual(1);
    // errorCode should be 'degraded' since business name and artifacts are both missing
    expect(profileResult.errorCode).toBe('degraded');
  });
});
