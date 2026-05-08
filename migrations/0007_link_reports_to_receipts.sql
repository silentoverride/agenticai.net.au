-- Migration 0007: Link reports to receipts one-to-one.
--
-- Users already own many receipts through receipts.user_id.
-- Each report may now reference one receipt, and the unique index ensures a
-- receipt can only be attached to one report.

ALTER TABLE reports ADD COLUMN receipt_id TEXT REFERENCES receipts(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_receipt_id ON reports(receipt_id);

-- Backfill report/receipt links by matching the Stripe Checkout session.
-- If duplicate report rows share the same session, keep the earliest report
-- linked and leave later rows unlinked to preserve the one-to-one constraint.
UPDATE reports
SET receipt_id = (
  SELECT receipts.id
  FROM receipts
  WHERE receipts.stripe_session_id = reports.session_id
  LIMIT 1
)
WHERE receipt_id IS NULL
  AND session_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM receipts
    WHERE receipts.stripe_session_id = reports.session_id
  )
  AND id = (
    SELECT r2.id
    FROM reports r2
    WHERE r2.session_id = reports.session_id
    ORDER BY r2.created_at, r2.id
    LIMIT 1
  );
