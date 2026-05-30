import { describe, expect, it, beforeEach } from 'vitest';
import { createMemoryDb } from '../test-db';
import { getAssessmentReview } from '$lib/server/staff-portal/read-models/get-assessment-review';

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
    staff_id TEXT,
    staff_notes TEXT,
    edited_content TEXT,
    reviewed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`;

function seedTestData(sqlite: ReturnType<typeof createMemoryDb>['sqlite']) {
  sqlite.exec(`
    INSERT INTO pipeline_status (session_id, status, created_at, updated_at) VALUES
      ('assess-review-1', 'human_assist', '2026-05-20T10:00:00Z', '2026-05-20T10:00:00Z');

    INSERT INTO assessment_orders (id, session_id, customer_name, company) VALUES
      ('order-r1', 'assess-review-1', 'Review Corp', 'Review Corp');

    INSERT INTO reports (id, session_id, r2_key, deck_url, title, created_at) VALUES
      ('report-r1', 'assess-review-1', 'r2/assess-review-1/v1', NULL, 'Original Report', '2026-05-20T10:05:00Z');

    INSERT INTO assessment_gates (gate_run_id, assessment_id, gate_type, verdict, confidence, reasoning, details, model, created_at) VALUES
      ('gate-r1', 'assess-review-1', 'quick-wins-verification', 'human_assist', 0.68,
        'Found potential quick win opportunity with unclear ownership',
        'The assessment indicates a quick win but the responsible team is not identified.',
        'gpt-5.5', '2026-05-20T10:30:00Z'),
      ('gate-r2', 'assess-review-1', 'report-review', 'block', 0.88,
        'Report contains conflicting data on revenue figures',
        'Revenue projections in section 3 conflict with source data in section 5.',
        'gpt-5.5', '2026-05-20T10:35:00Z');

    INSERT INTO human_assist_reviews (id, assessment_id, gate_run_id, status, staff_notes, created_at) VALUES
      ('review-r1', 'assess-review-1', 'gate-r1', 'pending', 'Awaiting staff assessment', '2026-05-20T10:40:00Z');
  `);
}

function seedDegradedData(sqlite: ReturnType<typeof createMemoryDb>['sqlite']) {
  // Minimal data — no gates, no artifacts
  sqlite.exec(`
    INSERT INTO pipeline_status (session_id, status, created_at, updated_at) VALUES
      ('assess-degraded', 'ready', '2026-05-20T10:00:00Z', '2026-05-20T10:00:00Z');

    INSERT INTO assessment_orders (id, session_id, customer_name, company) VALUES
      ('order-deg', 'assess-degraded', 'Degraded Co', 'Degraded Co');
  `);
}

describe('getAssessmentReview', () => {
  let db: ReturnType<typeof createMemoryDb>['db'];

  beforeEach(() => {
    const mem = createMemoryDb(SCHEMA);
    db = mem.db;
    seedTestData(mem.sqlite);
  });

  it('returns full review workspace with linked gate findings and report context', async () => {
    const review = await getAssessmentReview({
      db,
      assessmentId: 'assess-review-1',
      actorId: 'staffer-user',
      role: 'staff'
    });

    expect(review.assessmentId).toBe('assess-review-1');
    expect(review.clientName).toBe('Review Corp');
    expect(review.reportState).toBeDefined();
    expect(review.humanReviewState).toBeDefined();

    // Report context
    expect(review.reportContext.businessName).toBe('Review Corp');
    expect(review.reportContext.journeyStage).toBeDefined();
    expect(Array.isArray(review.reportContext.riskFlags)).toBe(true);

    // Linked gate findings
    expect(review.linkedGateFindings.length).toBe(2);
    const blockFinding = review.linkedGateFindings.find((f) => f.verdict === 'block');
    expect(blockFinding).toBeDefined();
    expect(blockFinding!.type).toBe('report-review');
    expect(blockFinding!.confidence).toBe(0.88);
    expect(blockFinding!.reasoning).toContain('conflicting data');
    expect(blockFinding!.state).toBeDefined();
    expect(blockFinding!.riskSignal).toBeDefined();
    expect(blockFinding!.riskSignal.label).toBeDefined();

    const humanAssistFinding = review.linkedGateFindings.find((f) => f.verdict === 'human_assist');
    expect(humanAssistFinding).toBeDefined();
    expect(humanAssistFinding!.decisionNotes).toBe('Awaiting staff assessment');

    // Artifact history
    expect(review.artifactHistory.length).toBe(1);
    expect(review.artifactHistory[0].available).toBe(true);
    expect(review.artifactHistory[0].type).toBe('original');

    // Available actions
    expect(review.availableActions.length).toBeGreaterThan(0);

    // State presentation
    expect(review.statePresentation).toBeDefined();
    expect(review.statePresentation.label).toBeDefined();
    expect(review.statePresentation.testId).toBeDefined();
  });

  it('gracefully degrades when artifacts, gate findings are missing', async () => {
    const { db: degradedDb, sqlite } = createMemoryDb(SCHEMA);
    seedDegradedData(sqlite);

    const review = await getAssessmentReview({
      db: degradedDb,
      assessmentId: 'assess-degraded',
      actorId: 'staffer-user',
      role: 'staff'
    });

    expect(review.assessmentId).toBe('assess-degraded');
    expect(review.clientName).toBe('Degraded Co');
    expect(review.reportState).toBeDefined();
    expect(review.linkedGateFindings).toEqual([]);
    expect(review.artifactHistory).toEqual([]);
    // State presentation should still work
    expect(review.statePresentation).toBeDefined();
  });

  it('returns non-leaking permission denied for non-existent assessment', async () => {
    await expect(
      getAssessmentReview({
        db,
        assessmentId: 'nonexistent-id',
        actorId: 'staffer-user',
        role: 'staff'
      })
    ).rejects.toThrow('You do not have access to this assessment.');
  });

  it('returns camelCase, serializable DTO structure', async () => {
    const review = await getAssessmentReview({
      db,
      assessmentId: 'assess-review-1',
      actorId: 'staffer-user',
      role: 'staff'
    });

    const json = JSON.parse(JSON.stringify(review));
    expect(json.assessmentId).toBe('assess-review-1');
    expect(json.clientName).toBe('Review Corp');
    expect(json.linkedGateFindings).toBeDefined();
    expect(json.linkedGateFindings[0].id).toBeDefined();
    expect(json.linkedGateFindings[0].riskSignal).toBeDefined();
    expect(json.artifactHistory).toBeDefined();
    expect(json.artifactHistory[0].versionId).toBeDefined();
    expect(json.availableActions).toBeDefined();
    expect(json.statePresentation).toBeDefined();
    expect(json.blockedReasons).toBeDefined();
  });
});
