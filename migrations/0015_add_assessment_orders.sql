-- Assessment orders table for immutable audit trail
-- Migrations 0001–0009 reserved for Epic 1, 0010–0019 for Epic 2a

CREATE TABLE IF NOT EXISTS assessment_orders (
  id TEXT PRIMARY KEY,                           -- UUID-based order ID
  session_id TEXT NOT NULL,                       -- Client session identifier
  source TEXT NOT NULL DEFAULT 'annie-chat-intake',
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK(status IN (
    'pending_payment', 'paid', 'queued', 'processing', 'completed', 'failed', 'cancelled'
  )),
  customer_name TEXT,
  customer_email TEXT,
  company TEXT,
  amount_cents INTEGER NOT NULL DEFAULT 120000,
  currency TEXT NOT NULL DEFAULT 'aud',
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  r2_key TEXT,                                   -- Primary R2 object key prefix
  metadata_json TEXT,                            -- Flexible metadata (JSON string)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT,
  queued_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX idx_assessment_orders_session_id ON assessment_orders(session_id);
CREATE INDEX idx_assessment_orders_status ON assessment_orders(status);
CREATE INDEX idx_assessment_orders_stripe_session ON assessment_orders(stripe_session_id);
CREATE INDEX idx_assessment_orders_created_at ON assessment_orders(created_at);
