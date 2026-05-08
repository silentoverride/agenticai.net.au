-- Migration 0006: Make reports belong directly to users.
--
-- The old portal schema used user_reports as a user/report link table.
-- The app only supports one owner per report, so ownership now lives on
-- reports.user_id and user_reports is removed after data is copied across.

ALTER TABLE reports ADD COLUMN user_id TEXT REFERENCES users(clerk_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);

-- Copy ownership from existing link rows into canonical report rows.
UPDATE reports
SET
  user_id = COALESCE(
    user_id,
    (SELECT ur.user_id FROM user_reports ur WHERE ur.report_id = reports.id LIMIT 1)
  ),
  session_id = COALESCE(
    session_id,
    (SELECT ur.stripe_session_id FROM user_reports ur WHERE ur.report_id = reports.id LIMIT 1)
  ),
  deck_url = COALESCE(
    deck_url,
    (SELECT ur.deck_url FROM user_reports ur WHERE ur.report_id = reports.id LIMIT 1)
  ),
  title = COALESCE(
    title,
    (SELECT ur.title FROM user_reports ur WHERE ur.report_id = reports.id LIMIT 1)
  ),
  company = COALESCE(
    company,
    (SELECT ur.company FROM user_reports ur WHERE ur.report_id = reports.id LIMIT 1)
  )
WHERE EXISTS (SELECT 1 FROM user_reports ur WHERE ur.report_id = reports.id);

-- Preserve links that do not have a canonical reports row yet.
INSERT INTO reports (id, user_id, session_id, deck_url, title, company, created_at)
SELECT
  ur.report_id,
  ur.user_id,
  ur.stripe_session_id,
  ur.deck_url,
  ur.title,
  ur.company,
  ur.created_at
FROM user_reports ur
WHERE NOT EXISTS (SELECT 1 FROM reports r WHERE r.id = ur.report_id)
  AND ur.id = (
    SELECT ur2.id
    FROM user_reports ur2
    WHERE ur2.report_id = ur.report_id
    ORDER BY ur2.created_at, ur2.id
    LIMIT 1
  );

DROP INDEX IF EXISTS idx_user_reports_user_id;
DROP INDEX IF EXISTS idx_user_reports_report_id;
DROP TABLE IF EXISTS user_reports;
