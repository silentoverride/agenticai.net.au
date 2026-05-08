-- Migration 0008: Optimize portal lookup and linking indexes.
--
-- These indexes match the app's hot paths:
-- - user lookup by email during Stripe webhook processing
-- - report/receipt lists by owner ordered newest first
-- - pending receipt linking by case-insensitive customer email
-- - report/receipt linking by Stripe session where receipt_id is still empty

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_reports_user_created
  ON reports(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_session_receipt
  ON reports(session_id, receipt_id);

CREATE INDEX IF NOT EXISTS idx_receipts_user_created
  ON receipts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_receipts_pending_customer_email_lower
  ON receipts(LOWER(customer_email))
  WHERE user_id IS NULL AND customer_email IS NOT NULL;
