-- Migration 0010: Add pipeline/transcript/report relationship constraints.
--
-- Target relationships:
-- - pipeline_status 1 -> 1 reports via pipeline_status.report_id
-- - transcripts 1 -> many pipeline_status via pipeline_status.call_id
-- - transcripts 1 -> 1 reports via reports.call_id
--
-- Existing SQLite/D1 tables cannot add foreign-key clauses to existing
-- columns with ALTER TABLE, so this migration backfills and enforces
-- cardinality with unique indexes. The local bootstrap schema defines the
-- foreign keys for fresh databases.

-- Backfill pipeline -> report from reports.session_id where report_id is absent.
UPDATE pipeline_status
SET report_id = (
  SELECT reports.id
  FROM reports
  WHERE reports.session_id = pipeline_status.session_id
  ORDER BY reports.created_at, reports.id
  LIMIT 1
)
WHERE report_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM reports
    WHERE reports.session_id = pipeline_status.session_id
  );

-- Backfill report -> transcript from pipeline_status.call_id where call_id is absent.
UPDATE reports
SET call_id = (
  SELECT pipeline_status.call_id
  FROM pipeline_status
  WHERE pipeline_status.report_id = reports.id
    AND pipeline_status.call_id IS NOT NULL
  ORDER BY pipeline_status.created_at, pipeline_status.session_id
  LIMIT 1
)
WHERE call_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM pipeline_status
    WHERE pipeline_status.report_id = reports.id
      AND pipeline_status.call_id IS NOT NULL
  );

-- Keep only the earliest pipeline row for each report_id before adding 1:1 uniqueness.
UPDATE pipeline_status
SET report_id = NULL
WHERE report_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM pipeline_status earlier
    WHERE earlier.report_id = pipeline_status.report_id
      AND (
        earlier.created_at < pipeline_status.created_at
        OR (earlier.created_at = pipeline_status.created_at AND earlier.session_id < pipeline_status.session_id)
      )
  );

-- Keep only the earliest report row for each transcript call_id before adding 1:1 uniqueness.
UPDATE reports
SET call_id = NULL
WHERE call_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM reports earlier
    WHERE earlier.call_id = reports.call_id
      AND (
        earlier.created_at < reports.created_at
        OR (earlier.created_at = reports.created_at AND earlier.id < reports.id)
      )
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_pipeline_status_report_id_unique
  ON pipeline_status(report_id)
  WHERE report_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_call_id_unique
  ON reports(call_id)
  WHERE call_id IS NOT NULL;
