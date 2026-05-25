import { describe, expect, it } from 'vitest';
import { createMemoryDb } from '../test-db';
import { getLinkedGateFindings } from '$lib/server/staff-portal/read-models/get-linked-gate-findings';

/**
 * Schema matches the actual migration (0013_add_gate_metadata.sql).
 * assessment_gates has no severity, flagged_section, related_intake_evidence,
 * or inspection_steps columns — those are handled as nullable extras.
 */
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
`;

describe('getLinkedGateFindings', () => {
  function makeDb(seed?: (s: import('better-sqlite3').Database) => void) {
    const { db, sqlite } = createMemoryDb(SCHEMA);
    if (seed) seed(sqlite);
    return { db, sqlite };
  }

  // -----------------------------------------------------------------------
  // Unresolved findings returned
  // -----------------------------------------------------------------------

  it('returns unresolved (open) gate findings', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO assessment_gates (gate_run_id, assessment_id, gate_type, verdict, confidence, reasoning, details)
        VALUES ('gate-001', 'asst-001', 'report-review', 'block', 0.85, 'Insufficient evidence for recommendation', 'Details about missing evidence');

        INSERT INTO assessment_gates (gate_run_id, assessment_id, gate_type, verdict, confidence, reasoning, details)
        VALUES ('gate-002', 'asst-001', 'quick-wins-verification', 'approve', 0.92, 'All criteria met', 'Quick wins verified successfully');
      `);
    });

    const result = await getLinkedGateFindings({ db, assessmentId: 'asst-001' });

    // Both should be returned as unresolved (no human_assist_reviews records)
    expect(result).toHaveLength(2);
    expect(result.map((f) => f.findingId)).toEqual(expect.arrayContaining(['gate-001', 'gate-002']));
  });

  // -----------------------------------------------------------------------
  // Recently resolved findings included
  // -----------------------------------------------------------------------

  it('includes recently resolved findings within the lookback window', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO assessment_gates (gate_run_id, assessment_id, gate_type, verdict, confidence, created_at)
        VALUES ('gate-010', 'asst-002', 'report-review', 'approve', 0.9, '2026-05-20T00:00:00Z');

        INSERT INTO human_assist_reviews (id, assessment_id, gate_run_id, status, reviewed_at)
        VALUES ('har-010', 'asst-002', 'gate-010', 'approved', '2026-05-22T00:00:00Z');
      `);
    });

    const result = await getLinkedGateFindings({
      db,
      assessmentId: 'asst-002',
      recentResolvedDays: 90 // generous window to include it
    });

    expect(result).toHaveLength(1);
    expect(result[0].findingId).toBe('gate-010');
    expect(result[0].decisionState).toBe('resolved');
  });

  // -----------------------------------------------------------------------
  // Blocking findings flagged
  // -----------------------------------------------------------------------

  it('marks blocking verdicts as isBlocking', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO assessment_gates (gate_run_id, assessment_id, gate_type, verdict, confidence)
        VALUES ('gate-b1', 'asst-003', 'report-review', 'block', 0.9);

        INSERT INTO assessment_gates (gate_run_id, assessment_id, gate_type, verdict, confidence)
        VALUES ('gate-b2', 'asst-003', 'major-project-verification', 'retry', 0.7);

        INSERT INTO assessment_gates (gate_run_id, assessment_id, gate_type, verdict, confidence)
        VALUES ('gate-nb', 'asst-003', 'quick-wins-verification', 'approve', 0.95);
      `);
    });

    const result = await getLinkedGateFindings({ db, assessmentId: 'asst-003' });

    const blocking = result.filter((f) => f.isBlocking);
    const nonBlocking = result.filter((f) => !f.isBlocking);

    expect(blocking).toHaveLength(2);
    expect(blocking.map((f) => f.findingId)).toEqual(['gate-b1', 'gate-b2']);

    expect(nonBlocking).toHaveLength(1);
    expect(nonBlocking[0].findingId).toBe('gate-nb');
  });

  // -----------------------------------------------------------------------
  // Empty state — no findings
  // -----------------------------------------------------------------------

  it('returns empty array when no gate findings exist', async () => {
    const { db } = makeDb();

    const result = await getLinkedGateFindings({ db, assessmentId: 'asst-999' });

    expect(result).toEqual([]);
  });

  // -----------------------------------------------------------------------
  // DTO shape and lifecycle vocabulary consistency
  // -----------------------------------------------------------------------

  it('returns DTOs with consistent shape', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO assessment_gates (gate_run_id, assessment_id, gate_type, verdict, confidence, reasoning, details)
        VALUES ('gate-dto', 'asst-004', 'report-review', 'block', 0.78, 'Reasoning text', 'Detail text');
      `);
    });

    const result = await getLinkedGateFindings({ db, assessmentId: 'asst-004' });

    expect(result).toHaveLength(1);
    const dto = result[0];

    // Verify all expected fields
    expect(dto).toHaveProperty('findingId');
    expect(dto).toHaveProperty('type');
    expect(dto).toHaveProperty('verdict');
    expect(dto).toHaveProperty('confidence');
    expect(dto).toHaveProperty('severity');
    expect(dto).toHaveProperty('reasoning');
    expect(dto).toHaveProperty('details');
    expect(dto).toHaveProperty('flaggedSection');
    expect(dto).toHaveProperty('relatedIntakeEvidence');
    expect(dto).toHaveProperty('suggestedInspectionSteps');
    expect(dto).toHaveProperty('decisionState');
    expect(dto).toHaveProperty('linkedReportId');
    expect(dto).toHaveProperty('isBlocking');

    // Verify values
    expect(dto.findingId).toBe('gate-dto');
    expect(dto.type).toBe('report-review');
    expect(dto.verdict).toBe('block');
    expect(dto.confidence).toBe(0.78);
    expect(dto.reasoning).toBe('Reasoning text');
    expect(dto.details).toBe('Detail text');
    expect(dto.isBlocking).toBe(true);
    expect(dto.linkedReportId).toBe('asst-004');

    // These are nullable and may not be in the schema
    expect(dto.severity).toBeNull();
    expect(dto.flaggedSection).toBeNull();
    expect(dto.relatedIntakeEvidence).toBeNull();
    expect(dto.suggestedInspectionSteps).toBeNull();
  });

  // -----------------------------------------------------------------------
  // Decision state mapping via gate-finding mapper
  // -----------------------------------------------------------------------

  it('maps decision state through gate-finding state mapper', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO assessment_gates (gate_run_id, assessment_id, gate_type, verdict, confidence)
        VALUES ('gate-st1', 'asst-005', 'report-review', 'block', 0.8);

        -- In review
        INSERT INTO assessment_gates (gate_run_id, assessment_id, gate_type, verdict, confidence)
        VALUES ('gate-st2', 'asst-005', 'report-review', 'approve', 0.9);

        INSERT INTO human_assist_reviews (id, assessment_id, gate_run_id, status)
        VALUES ('har-st2', 'asst-005', 'gate-st2', 'in_review');
      `);
    });

    const result = await getLinkedGateFindings({ db, assessmentId: 'asst-005' });

    expect(result).toHaveLength(2);

    const blocked = result.find((f) => f.findingId === 'gate-st1');
    expect(blocked).toBeDefined();
    expect(blocked!.decisionState).toBe('open');
    expect(blocked!.isBlocking).toBe(true);

    const inReview = result.find((f) => f.findingId === 'gate-st2');
    expect(inReview).toBeDefined();
    expect(inReview!.decisionState).toBe('inReview');
    expect(inReview!.isBlocking).toBe(false);
  });
});
