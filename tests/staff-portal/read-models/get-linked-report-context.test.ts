import { describe, expect, it } from 'vitest';
import { createMemoryDb } from '../test-db';
import { getLinkedReportContext } from '$lib/server/staff-portal/read-models/get-linked-report-context';
import {
  REPORT_STATE_PRESENTATION
} from '$lib/staff-portal/dto';

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
    confidence REAL DEFAULT 0.0,
    reasoning TEXT,
    details TEXT,
    severity TEXT,
    flagged_section TEXT,
    related_intake_evidence TEXT,
    inspection_steps TEXT,
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

describe('getLinkedReportContext', () => {
  function makeDb(seed?: (s: import('better-sqlite3').Database) => void) {
    const { db, sqlite } = createMemoryDb(SCHEMA);
    if (seed) seed(sqlite);
    return { db, sqlite };
  }

  // -----------------------------------------------------------------------
  // Current + historical reports returned with correct state mapping
  // -----------------------------------------------------------------------

  it('returns current and historical reports with correct state mapping', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO pipeline_status (session_id, status, created_at, updated_at)
        VALUES ('asst-001', 'ready', '2026-05-01T00:00:00Z', '2026-05-02T00:00:00Z');

        INSERT INTO reports (id, session_id, r2_key, title, created_at)
        VALUES ('rpt-001', 'asst-001', 'reports/rpt-001.pdf', 'Initial Report', '2026-05-01T01:00:00Z');

        INSERT INTO reports (id, session_id, r2_key, title, created_at)
        VALUES ('rpt-002', 'asst-001', 'reports/rpt-002.pdf', 'Regenerated Report', '2026-05-02T01:00:00Z');
      `);
    });

    const result = await getLinkedReportContext({ db, assessmentId: 'asst-001' });

    expect(result).toHaveLength(2);
    expect(result[0].reportId).toBe('rpt-002');
    expect(result[0].title).toBe('Regenerated Report');
    expect(result[0].reportState).toBe('generated');
    expect(result[0].hasArtifacts).toBe(true);
    expect(result[0].artifactVersion).toBe('rpt-002.pdf');

    expect(result[1].reportId).toBe('rpt-001');
    expect(result[1].title).toBe('Initial Report');
    expect(result[1].hasArtifacts).toBe(true);
  });

  // -----------------------------------------------------------------------
  // Missing artifacts → degraded field flag
  // -----------------------------------------------------------------------

  it('flags degraded fields when artifacts are missing', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO pipeline_status (session_id, status, created_at, updated_at)
        VALUES ('asst-002', 'ready', '2026-05-01T00:00:00Z', '2026-05-02T00:00:00Z');

        INSERT INTO reports (id, session_id, r2_key, title, created_at)
        VALUES ('rpt-003', 'asst-002', NULL, 'No Artifact Report', '2026-05-01T01:00:00Z');
      `);
    });

    const result = await getLinkedReportContext({ db, assessmentId: 'asst-002' });

    expect(result).toHaveLength(1);
    expect(result[0].reportId).toBe('rpt-003');
    expect(result[0].hasArtifacts).toBe(false);
    expect(result[0].degradedFields).toContain('artifacts');
  });

  // -----------------------------------------------------------------------
  // Conflicting records → degraded/review-required
  // -----------------------------------------------------------------------

  it('surfaces conflicting pipeline/review records as degraded state', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO pipeline_status (session_id, status, created_at, updated_at)
        VALUES ('asst-003', 'failed', '2026-05-01T00:00:00Z', '2026-05-02T00:00:00Z');

        INSERT INTO reports (id, session_id, r2_key, title, created_at)
        VALUES ('rpt-004', 'asst-003', 'reports/rpt-004.pdf', 'Conflicted Report', '2026-05-01T01:00:00Z');

        -- Conflicting: pipeline says failed but human review says approved
        INSERT INTO human_assist_reviews (id, assessment_id, status, operator_id, reviewed_at)
        VALUES ('har-001', 'asst-003', 'approved', 'op-001', '2026-05-02T02:00:00Z');
      `);
    });

    const result = await getLinkedReportContext({ db, assessmentId: 'asst-003' });

    expect(result).toHaveLength(1);
    expect(result[0].degradedFields).toContain('state');
    expect(result[0].reportState).toBe('conflict');
  });

  // -----------------------------------------------------------------------
  // Empty state — no reports or pipeline
  // -----------------------------------------------------------------------

  it('returns empty array when no pipeline or report data exists', async () => {
    const { db } = makeDb(); // no seed → empty DB

    const result = await getLinkedReportContext({ db, assessmentId: 'asst-999' });

    expect(result).toEqual([]);
  });

  // -----------------------------------------------------------------------
  // Pipeline-derived report when no explicit reports row
  // -----------------------------------------------------------------------

  it('returns a report derived from pipeline data when no reports table row exists', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO pipeline_status (session_id, status, deck_url, created_at, updated_at)
        VALUES ('asst-004', 'ready', 'https://deck.example.com/report', '2026-05-01T00:00:00Z', '2026-05-02T00:00:00Z');
      `);
    });

    const result = await getLinkedReportContext({ db, assessmentId: 'asst-004' });

    expect(result).toHaveLength(1);
    expect(result[0].reportState).toBe('generated');
    expect(result[0].hasArtifacts).toBe(true);
    expect(result[0].degradedFields).toHaveLength(0);
    expect(result[0].reviewWorkspaceRoute).toBe('/operator/assessments/asst-004/review');
  });

  // -----------------------------------------------------------------------
  // DTO shape and lifecycle vocabulary consistency
  // -----------------------------------------------------------------------

  it('returns DTOs with consistent lifecycle vocabulary', async () => {
    const { db } = makeDb((s) => {
      s.exec(`
        INSERT INTO pipeline_status (session_id, status, created_at, updated_at)
        VALUES ('asst-005', 'generating', '2026-05-01T00:00:00Z', '2026-05-02T00:00:00Z');

        INSERT INTO reports (id, session_id, r2_key, title, created_at)
        VALUES ('rpt-005', 'asst-005', 'reports/rpt-005.pdf', 'Generating Report', '2026-05-01T01:00:00Z');
      `);
    });

    const result = await getLinkedReportContext({ db, assessmentId: 'asst-005' });

    expect(result).toHaveLength(1);
    const dto = result[0];

    // Verify DTO shape
    expect(dto).toHaveProperty('reportId');
    expect(dto).toHaveProperty('title');
    expect(dto).toHaveProperty('reportState');
    expect(dto).toHaveProperty('humanReviewState');
    expect(dto).toHaveProperty('artifactVersion');
    expect(dto).toHaveProperty('createdAt');
    expect(dto).toHaveProperty('hasArtifacts');
    expect(dto).toHaveProperty('degradedFields');
    expect(dto).toHaveProperty('reviewWorkspaceRoute');

    // Verify reportState is a valid key in REPORT_STATE_PRESENTATION
    expect(REPORT_STATE_PRESENTATION).toHaveProperty(dto.reportState);

    // Verify humanReviewState is one of the valid enum values
    const validHumanReviewStates = ['none', 'pending', 'inReview', 'approved', 'rejected', 'edited'];
    expect(validHumanReviewStates).toContain(dto.humanReviewState);
  });
});
