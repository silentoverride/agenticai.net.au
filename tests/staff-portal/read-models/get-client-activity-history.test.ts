import { describe, expect, it } from 'vitest';
import { createMemoryDb } from '../test-db';
import { getClientActivityHistory } from '$lib/server/staff-portal/read-models/get-client-activity-history';

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
`;

describe('getClientActivityHistory', () => {
  function makeDb(seed?: (s: import('better-sqlite3').Database) => void) {
    const { db, sqlite } = createMemoryDb(SCHEMA);
    if (seed) seed(sqlite);
    return { db, sqlite };
  }

  // -----------------------------------------------------------------------
  // Pipeline activity returned
  // -----------------------------------------------------------------------

  it('returns pipeline status activity', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO pipeline_status (session_id, status, created_at, updated_at)
        VALUES ('asst-001', 'completed', '2026-05-01T00:00:00Z', '2026-05-02T00:00:00Z');
      `);
    });

    const result = await getClientActivityHistory({ db, assessmentId: 'asst-001' });

    expect(result.length).toBeGreaterThanOrEqual(1);
    const pipelineActivity = result.find((a) => a.sourceDomain === 'pipeline');
    expect(pipelineActivity).toBeDefined();
    expect(pipelineActivity!.summary).toContain('completed');
    expect(pipelineActivity!.actor).toBeNull();
  });

  // -----------------------------------------------------------------------
  // Gate finding activity returned
  // -----------------------------------------------------------------------

  it('returns gate finding activity', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO pipeline_status (session_id, status, created_at, updated_at)
        VALUES ('asst-002', 'ready', '2026-05-01T00:00:00Z', '2026-05-02T00:00:00Z');

        INSERT INTO assessment_gates (gate_run_id, assessment_id, gate_type, verdict, confidence, created_at)
        VALUES ('gate-001', 'asst-002', 'report-review', 'block', 0.85, '2026-05-02T00:00:00Z');
      `);
    });

    const result = await getClientActivityHistory({ db, assessmentId: 'asst-002' });

    const gateActivity = result.find((a) => a.sourceDomain === 'gate');
    expect(gateActivity).toBeDefined();
    expect(gateActivity!.summary).toContain('blocked');
    expect(gateActivity!.summary).toContain('Report Review');
  });

  // -----------------------------------------------------------------------
  // Human assist review activity returned
  // -----------------------------------------------------------------------

  it('returns human review activity', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO pipeline_status (session_id, status, created_at, updated_at)
        VALUES ('asst-003', 'ready', '2026-05-01T00:00:00Z', '2026-05-02T00:00:00Z');

        INSERT INTO human_assist_reviews (id, assessment_id, gate_type, status, operator_id, reviewed_at, created_at)
        VALUES ('har-001', 'asst-003', 'report-review', 'approved', 'op-001', '2026-05-03T00:00:00Z', '2026-05-01T00:00:00Z');
      `);
    });

    const result = await getClientActivityHistory({ db, assessmentId: 'asst-003' });

    const reviewActivity = result.find((a) => a.sourceDomain === 'human_review');
    expect(reviewActivity).toBeDefined();
    expect(reviewActivity!.summary).toContain('approved');
    expect(reviewActivity!.actor).toBe('op-001');
  });

  // -----------------------------------------------------------------------
  // Activities sorted by timestamp descending
  // -----------------------------------------------------------------------

  it('returns activities sorted newest first', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO pipeline_status (session_id, status, created_at, updated_at)
        VALUES ('asst-004', 'ready', '2026-05-01T00:00:00Z', '2026-05-01T01:00:00Z');

        INSERT INTO assessment_gates (gate_run_id, assessment_id, gate_type, verdict, confidence, created_at)
        VALUES ('gate-004', 'asst-004', 'report-review', 'approve', 0.9, '2026-05-03T00:00:00Z');
      `);
    });

    const result = await getClientActivityHistory({ db, assessmentId: 'asst-004' });

    expect(result.length).toBeGreaterThanOrEqual(2);
    // First item should have the latest timestamp
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].timestamp.localeCompare(result[i].timestamp)).toBeGreaterThanOrEqual(0);
    }
  });

  // -----------------------------------------------------------------------
  // Empty state
  // -----------------------------------------------------------------------

  it('returns empty array when no activity sources exist', async () => {
    const { db } = makeDb();

    const result = await getClientActivityHistory({ db, assessmentId: 'asst-999' });

    expect(result).toEqual([]);
  });

  // -----------------------------------------------------------------------
  // DTO shape consistency
  // -----------------------------------------------------------------------

  it('returns DTOs with consistent shape', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO pipeline_status (session_id, status, created_at, updated_at)
        VALUES ('asst-005', 'running_llm', '2026-05-01T00:00:00Z', '2026-05-01T01:00:00Z');
      `);
    });

    const result = await getClientActivityHistory({ db, assessmentId: 'asst-005' });

    expect(result).toHaveLength(1);
    const dto = result[0];

    expect(dto).toHaveProperty('activityId');
    expect(dto).toHaveProperty('summary');
    expect(dto).toHaveProperty('timestamp');
    expect(dto).toHaveProperty('sourceDomain');
    expect(dto).toHaveProperty('actor');

    // All string fields should be camelCase
    expect(Object.keys(dto).every((k) => /^[a-z][a-zA-Z0-9]*$/.test(k))).toBe(true);
  });

  // -----------------------------------------------------------------------
  // Activity and audit are distinct — activity is operational memory
  // -----------------------------------------------------------------------

  it('provides operational memory distinct from formal audit', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO pipeline_status (session_id, status, created_at, updated_at)
        VALUES ('asst-006', 'completed', '2026-05-01T00:00:00Z', '2026-05-02T00:00:00Z');
      `);
    });

    const result = await getClientActivityHistory({ db, assessmentId: 'asst-006' });

    // Activity events come from operational sources, not audit events table
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.every((a) => a.sourceDomain === 'pipeline')).toBe(true);
    expect(result.some((a) => a.activityId.startsWith('pipeline-'))).toBe(true);
    // No audit-specific fields
    expect(result.some((a) => 'eventType' in a)).toBe(false);
  });
});
