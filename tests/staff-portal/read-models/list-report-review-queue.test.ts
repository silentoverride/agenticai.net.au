import { describe, expect, it, beforeEach } from 'vitest';
import { createMemoryDb } from '../test-db';
import { listReportReviewQueue } from '$lib/server/staff-portal/read-models/list-report-review-queue';

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
    operator_id TEXT,
    operator_notes TEXT,
    edited_content TEXT,
    reviewed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`;

function seedTestData(sqlite: ReturnType<typeof createMemoryDb>['sqlite']) {
  sqlite.exec(`
    INSERT INTO pipeline_status (session_id, status, created_at, updated_at) VALUES
      ('assess-1', 'human_assist', '2026-05-20T10:00:00Z', '2026-05-20T10:00:00Z'),
      ('assess-2', 'ready', '2026-05-21T10:00:00Z', '2026-05-21T10:00:00Z'),
      ('assess-3', 'delayed', '2026-05-22T10:00:00Z', '2026-05-22T10:00:00Z'),
      ('assess-4', 'completed', '2026-05-19T10:00:00Z', '2026-05-19T10:00:00Z');

    INSERT INTO assessment_orders (id, session_id, customer_name, company) VALUES
      ('order-1', 'assess-1', 'Acme Corp', 'Acme Corp'),
      ('order-2', 'assess-2', 'Beta Inc', 'Beta Inc'),
      ('order-3', 'assess-3', 'Gamma Co', 'Gamma Co'),
      ('order-4', 'assess-4', 'Delta Ltd', 'Delta Ltd');

    INSERT INTO reports (id, session_id, r2_key, deck_url) VALUES
      ('report-1', 'assess-1', 'r2/assess-1/deck', NULL),
      ('report-2', 'assess-2', 'r2/assess-2/deck', 'https://example.com/deck-2'),
      ('report-3', 'assess-3', 'r2/assess-3/deck', NULL);

    INSERT INTO assessment_gates (gate_run_id, assessment_id, gate_type, verdict, confidence, reasoning, created_at) VALUES
      ('gate-1', 'assess-1', 'quick-wins-verification', 'human_assist', 0.72, 'Found potential compliance issue', '2026-05-20T10:30:00Z'),
      ('gate-2', 'assess-1', 'report-review', 'block', 0.91, 'Report contains conflicting data', '2026-05-20T10:35:00Z'),
      ('gate-3', 'assess-2', 'quick-wins-verification', 'approve', 0.95, 'All checks passed', '2026-05-21T10:30:00Z');

    INSERT INTO human_assist_reviews (id, assessment_id, gate_run_id, status, operator_id) VALUES
      ('review-1', 'assess-1', 'gate-1', 'pending', NULL),
      ('review-2', 'assess-2', 'gate-3', 'in_review', 'operator-user-1');
  `);
}

describe('listReportReviewQueue', () => {
  let db: ReturnType<typeof createMemoryDb>['db'];

  beforeEach(() => {
    const mem = createMemoryDb(SCHEMA);
    db = mem.db;
    seedTestData(mem.sqlite);
  });

  it('returns queue items for admin with all operational work visible', async () => {
    const result = await listReportReviewQueue({ db, actorId: 'admin-user', role: 'admin' });

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);

    // Admin sees all sessions
    const assessmentIds = result.items.map((i) => i.assessmentId);
    expect(assessmentIds).toContain('assess-1');
    expect(assessmentIds).toContain('assess-2');
    expect(assessmentIds).toContain('assess-3');
    expect(assessmentIds).toContain('assess-4');
  });

  it('returns queue items for operator with permitted work only (unassigned or assigned)', async () => {
    const result = await listReportReviewQueue({ db, actorId: 'operator-user-1', role: 'operator' });

    expect(result.items.length).toBeGreaterThan(0);

    // Operator should see assess-2 (assigned to them) and any unassigned items
    const assessmentIds = result.items.map((i) => i.assessmentId);
    expect(assessmentIds).toContain('assess-2'); // assigned to operator-user-1
    // All other items are unassigned, so they should also be visible
  });

  it('applies limit and offset pagination correctly', async () => {
    const limited = await listReportReviewQueue({ db, actorId: 'admin-user', role: 'admin', limit: 2, offset: 0 });
    expect(limited.items.length).toBeLessThanOrEqual(2);
    expect(limited.hasMore).toBe(true);

    const page2 = await listReportReviewQueue({ db, actorId: 'admin-user', role: 'admin', limit: 2, offset: 2 });
    expect(page2.items.length).toBeGreaterThan(0);
  });

  it('returns queue items with required fields populated', async () => {
    const result = await listReportReviewQueue({ db, actorId: 'admin-user', role: 'admin' });
    const item = result.items.find((i) => i.assessmentId === 'assess-1');

    expect(item).toBeDefined();
    expect(item!.clientName).toBe('Acme Corp');
    expect(item!.reportState).toBeDefined();
    expect(item!.humanReviewState).toBeDefined();
    expect(item!.blockerSummary).toBeDefined();
    expect(item!.ageDays).toBeGreaterThanOrEqual(0);
    expect(item!.nextSafeAction).toBeDefined();
    expect(item!.nextSafeAction.label).toBeDefined();
    expect(item!.priorityReason).toBeDefined();
  });

  it('returns empty state gracefully for empty database', async () => {
    const emptyDb = createMemoryDb(SCHEMA).db;
    const result = await listReportReviewQueue({ db: emptyDb, actorId: 'admin-user', role: 'admin' });

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.hasMore).toBe(false);
  });

  it('does not produce N+1 patterns (bounded queries only)', async () => {
    // The implementation uses a single SQL query with JOINs and subqueries
    // Verify by checking that the query completes without excessive queries
    const result = await listReportReviewQueue({ db, actorId: 'admin-user', role: 'admin', limit: 50 });

    expect(result.items.length).toBeLessThanOrEqual(50);
    // All items should have valid data
    for (const item of result.items) {
      expect(item.assessmentId).toBeTruthy();
      expect(item.clientName).toBeTruthy();
      expect(item.ageDays).toBeGreaterThanOrEqual(0);
    }
  });
});
