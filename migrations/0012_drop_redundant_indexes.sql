-- Migration 0012: Drop redundant indexes.
--
-- Composite indexes and UNIQUE constraints already cover these lookup paths:
-- - idx_receipts_user_created covers filtering by receipts.user_id
-- - receipts.stripe_session_id UNIQUE creates an autoindex
-- - idx_reports_user_created covers filtering by reports.user_id
-- - idx_reports_session_receipt covers filtering by reports.session_id
-- - idx_reports_call_id_unique covers filtering by reports.call_id

DROP INDEX IF EXISTS idx_receipts_user_id;
DROP INDEX IF EXISTS idx_receipts_session;
DROP INDEX IF EXISTS idx_reports_user_id;
DROP INDEX IF EXISTS idx_reports_session;
DROP INDEX IF EXISTS idx_reports_call_id;
