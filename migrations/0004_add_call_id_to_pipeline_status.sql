-- Migration 0004: Add call_id to pipeline_status for resilient transcript lookup

ALTER TABLE pipeline_status ADD COLUMN call_id TEXT;
CREATE INDEX IF NOT EXISTS idx_pipeline_status_call_id ON pipeline_status(call_id);
