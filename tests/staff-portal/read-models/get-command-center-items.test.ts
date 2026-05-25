import { describe, expect, it, beforeEach } from 'vitest';
import { createMemoryDb } from '../test-db';
import { getCommandCenterItems } from '$lib/server/staff-portal/read-models/get-command-center-items';

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

  CREATE TABLE IF NOT EXISTS follow_ups (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    owner_id TEXT,
    due_date TEXT,
    source TEXT NOT NULL DEFAULT 'client_profile',
    status TEXT NOT NULL DEFAULT 'open',
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

  CREATE TABLE IF NOT EXISTS staff_activity_events (
    id TEXT PRIMARY KEY,
    assessment_id TEXT,
    summary TEXT,
    source_domain TEXT,
    actor TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`;

describe('getCommandCenterItems', () => {
  let sqlite: ReturnType<typeof createMemoryDb>['sqlite'];

  beforeEach(() => {
    const testDb = createMemoryDb(SCHEMA);
    sqlite = testDb.sqlite;
  });

  function makeDb() {
    return createMemoryDb(SCHEMA).db;
  }

  // -----------------------------------------------------------------------
  // Priority ordering
  // -----------------------------------------------------------------------

  it('orders escalated items before delayed items', async () => {
    const { db, sqlite: s } = createMemoryDb(SCHEMA);
    s.exec(`
      INSERT INTO pipeline_status (session_id, status, created_at) VALUES
        ('delayed-1', 'delayed', '2026-05-20T10:00:00Z'),
        ('escalated-1', 'human_assist', '2026-05-21T10:00:00Z');

      INSERT INTO assessment_orders (id, session_id, customer_name, company) VALUES
        ('o-delayed-1', 'delayed-1', 'Delayed Co', 'Delayed Co'),
        ('o-escalated-1', 'escalated-1', 'Escalated Co', 'Escalated Co');

      INSERT INTO reports (id, session_id, r2_key) VALUES
        ('r-delayed-1', 'delayed-1', 'r2/delayed-1/v1'),
        ('r-escalated-1', 'escalated-1', 'r2/escalated-1/v1');
    `);

    const result = await getCommandCenterItems({ db, actorId: 'admin-1', role: 'admin', limit: 10 });

    expect(result.items.length).toBeGreaterThanOrEqual(2);
    // Escalated should come first (lower priorityRank)
    expect(result.items[0].workItemId).toBe('escalated-1');
    expect(result.items[0].priorityReason).toContain('Escalated');
    expect(result.items[1].workItemId).toBe('delayed-1');
    expect(result.items[1].priorityReason).toContain('Delayed');
  });

  it('orders generated items after delayed items', async () => {
    const { db, sqlite: s } = createMemoryDb(SCHEMA);
    s.exec(`
      INSERT INTO pipeline_status (session_id, status, created_at) VALUES
        ('generated-1', 'ready', '2026-05-20T10:00:00Z'),
        ('delayed-2', 'delayed', '2026-05-19T10:00:00Z');

      INSERT INTO assessment_orders (id, session_id, customer_name, company) VALUES
        ('o-gen-1', 'generated-1', 'Gen Co', 'Gen Co'),
        ('o-del-2', 'delayed-2', 'Delay Co', 'Delay Co');

      INSERT INTO reports (id, session_id, r2_key) VALUES
        ('r-gen-1', 'generated-1', 'r2/gen-1/v1'),
        ('r-del-2', 'delayed-2', 'r2/del-2/v1');
    `);

    const result = await getCommandCenterItems({ db, actorId: 'admin-1', role: 'admin', limit: 10 });

    expect(result.items.length).toBeGreaterThanOrEqual(2);
    expect(result.items[0].workItemId).toBe('delayed-2');
    expect(result.items[1].workItemId).toBe('generated-1');
  });

  // -----------------------------------------------------------------------
  // Passive metric exclusion
  // -----------------------------------------------------------------------

  it('excludes items with no enabled action (passive metrics)', async () => {
    const { db, sqlite: s } = createMemoryDb(SCHEMA);
    s.exec(`
      INSERT INTO pipeline_status (session_id, status, created_at) VALUES
        ('passive-1', 'pending', '2026-05-20T10:00:00Z'),
        ('active-1', 'ready', '2026-05-21T10:00:00Z');

      INSERT INTO assessment_orders (id, session_id, customer_name, company) VALUES
        ('o-passive-1', 'passive-1', 'Passive Co', 'Passive Co'),
        ('o-active-1', 'active-1', 'Active Co', 'Active Co');

      INSERT INTO reports (id, session_id, r2_key) VALUES
        ('r-passive-1', 'passive-1', NULL),
        ('r-active-1', 'active-1', 'r2/active-1/v1');
    `);

    const result = await getCommandCenterItems({ db, actorId: 'admin-1', role: 'admin', limit: 10 });

    // passive-1 has no artifact → unavailable state → no enabled action → excluded
    expect(result.items.every((i: { workItemId: string }) => i.workItemId !== 'passive-1')).toBe(true);
    expect(result.items.some((i: { workItemId: string }) => i.workItemId === 'active-1')).toBe(true);
  });

  // -----------------------------------------------------------------------
  // Role-based filtering
  // -----------------------------------------------------------------------

  it('admin sees all items regardless of assignment', async () => {
    const { db, sqlite: s } = createMemoryDb(SCHEMA);
    s.exec(`
      INSERT INTO pipeline_status (session_id, status, created_at) VALUES
        ('admin-all-1', 'ready', '2026-05-20T10:00:00Z'),
        ('admin-all-2', 'ready', '2026-05-21T10:00:00Z');

      INSERT INTO assessment_orders (id, session_id, customer_name, company) VALUES
        ('o-admin-a1', 'admin-all-1', 'Item A', 'Item A'),
        ('o-admin-a2', 'admin-all-2', 'Item B', 'Item B');

      INSERT INTO reports (id, session_id, r2_key) VALUES
        ('r-admin-a1', 'admin-all-1', 'r2/a1/v1'),
        ('r-admin-a2', 'admin-all-2', 'r2/a2/v1');

      INSERT INTO human_assist_reviews (id, assessment_id, status, operator_id) VALUES
        ('har-admin-1', 'admin-all-1', 'pending', 'operator-other');
    `);

    const result = await getCommandCenterItems({ db, actorId: 'admin-1', role: 'admin', limit: 10 });

    expect(result.items.some((i: { workItemId: string }) => i.workItemId === 'admin-all-1')).toBe(true);
    expect(result.items.some((i: { workItemId: string }) => i.workItemId === 'admin-all-2')).toBe(true);
  });

  it('operator sees only assigned or shared-queue items', async () => {
    const { db, sqlite: s } = createMemoryDb(SCHEMA);
    s.exec(`
      INSERT INTO pipeline_status (session_id, status, created_at) VALUES
        ('op-assigned', 'ready', '2026-05-20T10:00:00Z'),
        ('op-shared', 'ready', '2026-05-21T10:00:00Z'),
        ('op-other', 'ready', '2026-05-22T10:00:00Z');

      INSERT INTO assessment_orders (id, session_id, customer_name, company) VALUES
        ('o-op-ass', 'op-assigned', 'Assigned Co', 'Assigned Co'),
        ('o-op-shared', 'op-shared', 'Shared Co', 'Shared Co'),
        ('o-op-other', 'op-other', 'Other Co', 'Other Co');

      INSERT INTO reports (id, session_id, r2_key) VALUES
        ('r-op-ass', 'op-assigned', 'r2/op-ass/v1'),
        ('r-op-shared', 'op-shared', 'r2/op-shared/v1'),
        ('r-op-other', 'op-other', 'r2/op-other/v1');

      INSERT INTO human_assist_reviews (id, assessment_id, status, operator_id) VALUES
        ('har-op-ass', 'op-assigned', 'in_review', 'operator-me'),
        ('har-op-other', 'op-other', 'in_review', 'operator-them');
    `);

    const result = await getCommandCenterItems({ db, actorId: 'operator-me', role: 'operator', limit: 10 });

    expect(result.items.some((i: { workItemId: string }) => i.workItemId === 'op-assigned')).toBe(true);
    expect(result.items.some((i: { workItemId: string }) => i.workItemId === 'op-shared')).toBe(true);
    expect(result.items.every((i: { workItemId: string }) => i.workItemId !== 'op-other')).toBe(true);
  });

  // -----------------------------------------------------------------------
  // Bounded query and pagination
  // -----------------------------------------------------------------------

  it('respects limit and offset pagination', async () => {
    const { db, sqlite: s } = createMemoryDb(SCHEMA);

    const inserts: string[] = [];
    for (let i = 0; i < 10; i++) {
      const sid = `page-item-${i}`;
      inserts.push(`
        INSERT INTO pipeline_status (session_id, status, created_at) VALUES
          ('${sid}', 'ready', '2026-05-${String(20 + i).padStart(2, '0')}T10:00:00Z');

        INSERT INTO assessment_orders (id, session_id, customer_name, company) VALUES
          ('o-${sid}', '${sid}', 'Item ${i}', 'Item ${i}');

        INSERT INTO reports (id, session_id, r2_key) VALUES
          ('r-${sid}', '${sid}', 'r2/${sid}/v1');
      `);
    }
    s.exec(inserts.join('\n'));

    const page1 = await getCommandCenterItems({ db, actorId: 'admin-1', role: 'admin', limit: 3, offset: 0 });
    expect(page1.items.length).toBe(3);
    expect(page1.total).toBe(10);
    expect(page1.hasMore).toBe(true);

    const page4 = await getCommandCenterItems({ db, actorId: 'admin-1', role: 'admin', limit: 3, offset: 9 });
    expect(page4.items.length).toBe(1);
    expect(page4.hasMore).toBe(false);
  });

  // -----------------------------------------------------------------------
  // Empty state
  // -----------------------------------------------------------------------

  it('returns empty items when no work exists', async () => {
    const { db } = createMemoryDb(SCHEMA);
    const result = await getCommandCenterItems({ db, actorId: 'admin-1', role: 'admin', limit: 10 });
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.hasMore).toBe(false);
  });

  // -----------------------------------------------------------------------
  // DTO shape validation
  // -----------------------------------------------------------------------

  it('returns camelCase DTOs with correct shape', async () => {
    const { db, sqlite: s } = createMemoryDb(SCHEMA);
    s.exec(`
      INSERT INTO pipeline_status (session_id, status, created_at, updated_at) VALUES
        ('dto-test-1', 'ready', '2026-05-20T10:00:00Z', '2026-05-20T10:00:00Z');

      INSERT INTO assessment_orders (id, session_id, customer_name, company) VALUES
        ('o-dto-1', 'dto-test-1', 'DTO Client', 'DTO Corp');

      INSERT INTO reports (id, session_id, r2_key) VALUES
        ('r-dto-1', 'dto-test-1', 'r2/dto-1/v1');
    `);

    const result = await getCommandCenterItems({ db, actorId: 'admin-1', role: 'admin', limit: 10 });
    expect(result.items.length).toBe(1);

    const item = result.items[0];
    expect(item).toHaveProperty('workItemId');
    expect(item).toHaveProperty('workItemType');
    expect(item).toHaveProperty('clientName');
    expect(item).toHaveProperty('lifecycleState');
    expect(item).toHaveProperty('owner');
    expect(item).toHaveProperty('dueDate');
    expect(item).toHaveProperty('ageDays');
    expect(item).toHaveProperty('priorityReason');
    expect(item).toHaveProperty('consequenceOfInaction');
    expect(item).toHaveProperty('priorityRank');
    expect(item).toHaveProperty('nextSafeAction');
    expect(item.nextSafeAction).toHaveProperty('id');
    expect(item.nextSafeAction).toHaveProperty('label');
    expect(item.nextSafeAction).toHaveProperty('enabled');
    expect(item.nextSafeAction).toHaveProperty('requiredRole');
    expect(item.workItemType).toBe('report');

    // No raw statuses in DTO
    expect(item).not.toHaveProperty('pipelineStatus');
    expect(item).not.toHaveProperty('rawStatus');
  });

  // -----------------------------------------------------------------------
  // Priority reason content
  // -----------------------------------------------------------------------

  it('generated items show review-needed priority reason', async () => {
    const { db, sqlite: s } = createMemoryDb(SCHEMA);
    s.exec(`
      INSERT INTO pipeline_status (session_id, status, created_at) VALUES
        ('reason-1', 'ready', '2026-05-20T10:00:00Z');

      INSERT INTO assessment_orders (id, session_id, customer_name, company) VALUES
        ('o-reason-1', 'reason-1', 'Reason Client', 'Reason Co');

      INSERT INTO reports (id, session_id, r2_key) VALUES
        ('r-reason-1', 'reason-1', 'r2/reason-1/v1');
    `);

    const result = await getCommandCenterItems({ db, actorId: 'admin-1', role: 'admin', limit: 10 });
    expect(result.items[0].priorityReason).toContain('Ready for review');
  });

  it('escalated items show blocked priority reason', async () => {
    const { db, sqlite: s } = createMemoryDb(SCHEMA);
    s.exec(`
      INSERT INTO pipeline_status (session_id, status, created_at) VALUES
        ('blocked-reason-1', 'human_assist', '2026-05-20T10:00:00Z');

      INSERT INTO assessment_orders (id, session_id, customer_name, company) VALUES
        ('o-blocked-1', 'blocked-reason-1', 'Blocked Client', 'Blocked Co');

      INSERT INTO reports (id, session_id, r2_key) VALUES
        ('r-blocked-1', 'blocked-reason-1', 'r2/blocked-1/v1');

      INSERT INTO assessment_gates (gate_run_id, assessment_id, gate_type, verdict, created_at) VALUES
        ('gate-blocked-1', 'blocked-reason-1', 'review', 'block', '2026-05-20T11:00:00Z');
    `);

    const result = await getCommandCenterItems({ db, actorId: 'admin-1', role: 'admin', limit: 10 });
    expect(result.items[0].priorityReason).toContain('Blocked');
  });

  // -----------------------------------------------------------------------
  // Consequence of inaction
  // -----------------------------------------------------------------------

  it('escalated items have delivery-blocked consequence', async () => {
    const { db, sqlite: s } = createMemoryDb(SCHEMA);
    s.exec(`
      INSERT INTO pipeline_status (session_id, status, created_at) VALUES
        ('cons-1', 'human_assist', '2026-05-20T10:00:00Z');

      INSERT INTO assessment_orders (id, session_id, customer_name, company) VALUES
        ('o-cons-1', 'cons-1', 'Cons Client', 'Cons Co');

      INSERT INTO reports (id, session_id, r2_key) VALUES
        ('r-cons-1', 'cons-1', 'r2/cons-1/v1');
    `);

    const result = await getCommandCenterItems({ db, actorId: 'admin-1', role: 'admin', limit: 10 });
    expect(result.items[0].consequenceOfInaction).toContain('blocked until review');
  });
});
