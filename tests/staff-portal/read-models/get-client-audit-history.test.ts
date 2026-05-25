import { describe, expect, it } from 'vitest';
import { createMemoryDb } from '../test-db';
import { getClientAuditHistory, getAuditTrail } from '$lib/server/staff-portal/read-models/get-client-audit-history';

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

  CREATE TABLE IF NOT EXISTS assessment_gates (
    gate_run_id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL,
    gate_type TEXT NOT NULL,
    verdict TEXT NOT NULL,
    confidence REAL NOT NULL DEFAULT 0.0,
    reasoning TEXT,
    details TEXT,
    model TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS human_assist_reviews (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL,
    gate_run_id TEXT,
    gate_type TEXT,
    status TEXT DEFAULT 'pending',
    operator_id TEXT,
    operator_notes TEXT,
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

describe('getClientAuditHistory', () => {
  function makeDb(seed?: (s: import('better-sqlite3').Database) => void) {
    const { db, sqlite } = createMemoryDb(SCHEMA);
    if (seed) seed(sqlite);
    return { db, sqlite };
  }

  // -----------------------------------------------------------------------
  // Audit events returned with all required fields (Admin view)
  // -----------------------------------------------------------------------

  it('returns audit events with all required fields for admin', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO staff_action_audit_events (id, assessment_id, target_type, target_id, actor_id, action, from_state, to_state, reason, request_hash, idempotency_key, created_at)
        VALUES ('evt-001', 'asst-001', 'report', 'rpt-001', 'op-001', 'approveReport', 'generated', 'approved', 'All findings resolved', 'hash-001', 'idem-001', '2026-05-22T10:00:00Z');

        INSERT INTO staff_action_audit_events (id, assessment_id, target_type, target_id, actor_id, action, from_state, to_state, reason_code, request_hash, idempotency_key, created_at)
        VALUES ('evt-002', 'asst-001', 'gate_finding', 'gate-001', 'op-001', 'resolveFinding', 'open', 'resolved', 'RC-001', 'hash-002', 'idem-002', '2026-05-22T09:00:00Z');
      `);
    });

    const result = await getClientAuditHistory({
      db,
      assessmentId: 'asst-001',
      actorId: 'op-001',
      role: 'admin'
    });

    expect(result).toHaveLength(2);

    // Latest first (evt-001 has later timestamp)
    expect(result[0].eventId).toBe('evt-001');
    expect(result[0].actor).toBe('op-001');
    expect(result[0].timestamp).toBe('2026-05-22T10:00:00Z');
    expect(result[0].eventType).toBe('report_state_change');
    expect(result[0].affectedEntity).toBe('rpt-001');
    expect(result[0].affectedEntityType).toBe('report');
    expect(result[0].previousState).toBe('generated');
    expect(result[0].newState).toBe('approved');
    expect(result[0].reasonOrNote).toBe('All findings resolved');
    expect(result[0].receiptRoute).toBe('/operator/assessments/asst-001/review#receipt-evt-001');
    expect(result[0].sourceContextRoute).toBe('/operator/assessments/asst-001');

    // Second event
    expect(result[1].eventId).toBe('evt-002');
    expect(result[1].eventType).toBe('gate_finding_decision');
    expect(result[1].affectedEntityType).toBe('gate_finding');
    expect(result[1].newState).toBe('resolved');
    expect(result[1].reasonOrNote).toBe('RC-001');
  });

  // -----------------------------------------------------------------------
  // Operator sees only their own audit events
  // -----------------------------------------------------------------------

  it('filters audit events for operator role to their own actorId', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO staff_action_audit_events (id, assessment_id, target_type, target_id, actor_id, action, from_state, to_state, reason, request_hash, idempotency_key, created_at)
        VALUES ('evt-100', 'asst-002', 'report', 'rpt-002', 'op-001', 'approveReport', 'generated', 'approved', 'Good', 'hash-100', 'idem-100', '2026-05-22T10:00:00Z');

        INSERT INTO staff_action_audit_events (id, assessment_id, target_type, target_id, actor_id, action, from_state, to_state, reason, request_hash, idempotency_key, created_at)
        VALUES ('evt-101', 'asst-002', 'report', 'rpt-002', 'op-002', 'rejectReport', 'generated', 'rejected', 'Issues found', 'hash-101', 'idem-101', '2026-05-22T11:00:00Z');
      `);
    });

    const result = await getClientAuditHistory({
      db,
      assessmentId: 'asst-002',
      actorId: 'op-001',
      role: 'operator'
    });

    // Operator should only see their own events
    expect(result).toHaveLength(1);
    expect(result[0].eventId).toBe('evt-100');
    expect(result[0].actor).toBe('op-001');
  });

  // -----------------------------------------------------------------------
  // Empty state
  // -----------------------------------------------------------------------

  it('returns empty array when no audit events exist', async () => {
    const { db } = makeDb();

    const result = await getClientAuditHistory({
      db,
      assessmentId: 'asst-999',
      actorId: 'op-001',
      role: 'admin'
    });

    expect(result).toEqual([]);
  });

  // -----------------------------------------------------------------------
  // DTO shape consistency
  // -----------------------------------------------------------------------

  it('returns DTOs with consistent shape', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO staff_action_audit_events (id, assessment_id, target_type, target_id, actor_id, action, from_state, to_state, reason_code, reason, request_hash, idempotency_key, created_at)
        VALUES ('evt-dto', 'asst-003', 'report', 'rpt-003', 'op-001', 'approveReport', 'generated', 'approved', 'RC-003', 'All good', 'hash-dto', 'idem-dto', '2026-05-22T12:00:00Z');
      `);
    });

    const result = await getClientAuditHistory({
      db,
      assessmentId: 'asst-003',
      actorId: 'op-001',
      role: 'admin'
    });

    expect(result).toHaveLength(1);
    const dto = result[0];

    expect(dto).toHaveProperty('eventId');
    expect(dto).toHaveProperty('actor');
    expect(dto).toHaveProperty('timestamp');
    expect(dto).toHaveProperty('eventType');
    expect(dto).toHaveProperty('affectedEntity');
    expect(dto).toHaveProperty('affectedEntityType');
    expect(dto).toHaveProperty('previousState');
    expect(dto).toHaveProperty('newState');
    expect(dto).toHaveProperty('reasonOrNote');
    expect(dto).toHaveProperty('receiptRoute');
    expect(dto).toHaveProperty('sourceContextRoute');

    // All string fields should be camelCase
    expect(Object.keys(dto).every((k) => /^[a-z][a-zA-Z0-9]*$/.test(k))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Admin Audit Trail
// ---------------------------------------------------------------------------

describe('getAuditTrail', () => {
  function makeDb(seed?: (s: import('better-sqlite3').Database) => void) {
    const { db, sqlite } = createMemoryDb(SCHEMA);
    if (seed) seed(sqlite);
    return { db, sqlite };
  }

  it('returns audit trail for admin role', async () => {
    const { db } = makeDb((s) => {
      for (let i = 1; i <= 5; i++) {
        const id = `evt-${i}`;
        s.exec(
          `INSERT INTO staff_action_audit_events (id, assessment_id, target_type, target_id, actor_id, action, from_state, to_state, request_hash, idempotency_key, created_at)
           VALUES ('${id}', 'asst-001', 'report', 'rpt-001', 'op-001', 'approveReport', 'generated', 'approved', 'hash-${i}', 'idem-${i}', '2026-05-2${i}T10:00:00Z')`
        );
      }
    });

    const result = await getAuditTrail({
      db,
      actorId: 'admin-001',
      role: 'admin',
      limit: 10
    });

    expect(result.events).toHaveLength(5);
    expect(result.total).toBe(5);
    expect(result.hasMore).toBe(false);
  });

  it('respects limit and pagination', async () => {
    const { db } = makeDb((s) => {
      for (let i = 1; i <= 10; i++) {
        const id = `evt-p${i}`;
        s.exec(
          `INSERT INTO staff_action_audit_events (id, assessment_id, target_type, target_id, actor_id, action, from_state, to_state, request_hash, idempotency_key, created_at)
           VALUES ('${id}', 'asst-003', 'report', 'rpt-003', 'op-001', 'approveReport', 'generated', 'approved', 'hash-p${i}', 'idem-p${i}', '2026-05-${String(i).padStart(2, '0')}T10:00:00Z')`
        );
      }
    });

    const result = await getAuditTrail({
      db,
      actorId: 'admin-001',
      role: 'admin',
      limit: 3,
      offset: 0
    });

    expect(result.events).toHaveLength(3);
    expect(result.total).toBe(10);
    expect(result.hasMore).toBe(true);

    // Second page
    const result2 = await getAuditTrail({
      db,
      actorId: 'admin-001',
      role: 'admin',
      limit: 3,
      offset: 3
    });

    expect(result2.events).toHaveLength(3);
    expect(result2.hasMore).toBe(true);
  });

  it('returns empty for non-admin role', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO staff_action_audit_events (id, assessment_id, target_type, target_id, actor_id, action, from_state, to_state, request_hash, idempotency_key, created_at)
        VALUES ('evt-op', 'asst-001', 'report', 'rpt-001', 'op-001', 'approveReport', 'generated', 'approved', 'hash-op', 'idem-op', '2026-05-22T10:00:00Z');
      `);
    });

    const result = await getAuditTrail({
      db,
      actorId: 'op-001',
      role: 'operator'
    });

    expect(result.events).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.hasMore).toBe(false);
  });
});
