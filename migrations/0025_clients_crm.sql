-- Migration 0025: Clients CRM tables
-- Triggered by Sprint Change Proposal 2026-06-05-clients-crm-page.
-- Adds 4 tables for the post-MVP Clients CRM track:
--   clients            — company + demographic record per client
--   client_files       — R2-backed file attachments
--   client_interactions — chronological engagement log
--   client_tasks       — tasks and appointments
--
-- Notes:
-- - Clients link to the existing `users` table via clerk_user_id (nullable)
--   so a Clerk-authenticated assessment creator can be tied to a CRM record.
-- - "Tags" is stored as JSON (text array) — D1 has no array type.
-- - "Custom fields" is stored as JSON for forward compatibility with the
--   "any custom demographic fields needed for the business" requirement
--   in the spec; admin UI to define schema is out of scope for v1.
-- - Soft-enums are validated at the application layer (Zod) — D1 has no enum.

-- =========================================================================
-- clients
-- =========================================================================
CREATE TABLE IF NOT EXISTS clients (
  id                    TEXT PRIMARY KEY,
  clerk_user_id         TEXT,
  company_name          TEXT NOT NULL,
  trading_name          TEXT,
  primary_contact_name  TEXT,
  job_title             TEXT,
  email                 TEXT,
  phone                 TEXT,
  secondary_phone       TEXT,
  website               TEXT,
  billing_address       TEXT,
  shipping_address      TEXT,
  tax_id                TEXT,
  industry              TEXT,
  company_size          TEXT,
  lead_source           TEXT,
  assigned_staff_id     TEXT,
  status                TEXT NOT NULL DEFAULT 'active',
  tags                  TEXT NOT NULL DEFAULT '[]',   -- JSON array of strings
  custom_fields         TEXT NOT NULL DEFAULT '{}',   -- JSON object
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at            TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (clerk_user_id) REFERENCES users(clerk_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_clients_company_name  ON clients(company_name);
CREATE INDEX IF NOT EXISTS idx_clients_email         ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status        ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_assigned      ON clients(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_clients_clerk_user    ON clients(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_at    ON clients(created_at);

-- =========================================================================
-- client_files
-- =========================================================================
CREATE TABLE IF NOT EXISTS client_files (
  id            TEXT PRIMARY KEY,
  client_id     TEXT NOT NULL,
  file_name     TEXT NOT NULL,
  file_type     TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT 'other',
  size_bytes    INTEGER NOT NULL DEFAULT 0,
  r2_key        TEXT NOT NULL,
  description   TEXT,
  uploaded_by   TEXT NOT NULL,
  uploaded_at   TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_client_files_client_id  ON client_files(client_id);
CREATE INDEX IF NOT EXISTS idx_client_files_category   ON client_files(category);
CREATE INDEX IF NOT EXISTS idx_client_files_uploaded   ON client_files(uploaded_at);

-- =========================================================================
-- client_interactions
-- =========================================================================
CREATE TABLE IF NOT EXISTS client_interactions (
  id              TEXT PRIMARY KEY,
  client_id       TEXT NOT NULL,
  type            TEXT NOT NULL,        -- phone | email | meeting | work | note | status_update
  staff_id        TEXT NOT NULL,
  summary         TEXT NOT NULL,
  occurred_at     TEXT NOT NULL DEFAULT (datetime('now')),
  linked_file_ids TEXT NOT NULL DEFAULT '[]',  -- JSON array
  linked_task_ids TEXT NOT NULL DEFAULT '[]',  -- JSON array
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_client_interactions_client    ON client_interactions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_interactions_type      ON client_interactions(type);
CREATE INDEX IF NOT EXISTS idx_client_interactions_staff     ON client_interactions(staff_id);
CREATE INDEX IF NOT EXISTS idx_client_interactions_occurred  ON client_interactions(occurred_at);

-- =========================================================================
-- client_tasks
-- =========================================================================
CREATE TABLE IF NOT EXISTS client_tasks (
  id                TEXT PRIMARY KEY,
  client_id         TEXT NOT NULL,
  type              TEXT NOT NULL,         -- task | appointment
  title             TEXT NOT NULL,
  description       TEXT,
  due_at            TEXT NOT NULL,
  assigned_staff_id TEXT,
  status            TEXT NOT NULL DEFAULT 'open',  -- open | in_progress | completed | cancelled
  priority          TEXT NOT NULL DEFAULT 'normal', -- low | normal | high | urgent
  completed_at      TEXT,
  created_by        TEXT NOT NULL,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_client_tasks_client      ON client_tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_client_tasks_type        ON client_tasks(type);
CREATE INDEX IF NOT EXISTS idx_client_tasks_status      ON client_tasks(status);
CREATE INDEX IF NOT EXISTS idx_client_tasks_due_at      ON client_tasks(due_at);
CREATE INDEX IF NOT EXISTS idx_client_tasks_assigned    ON client_tasks(assigned_staff_id);

-- =========================================================================
-- client_crm_audit_events
-- General-purpose audit log for CRM CRUD actions.
-- Distinct from staff_action_audit_events (which is assessment-scoped
-- and used by the staff portal state machine). This table covers the
-- broader clients/files/interactions/tasks domain.
-- =========================================================================
CREATE TABLE IF NOT EXISTS client_crm_audit_events (
  id           TEXT PRIMARY KEY,
  client_id    TEXT,
  target_type  TEXT NOT NULL,    -- client | client_file | client_interaction | client_task
  target_id    TEXT,
  actor_id     TEXT NOT NULL,
  action       TEXT NOT NULL,    -- create | update | delete | upload | download
  metadata     TEXT,            -- JSON
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_client_crm_audit_client_id  ON client_crm_audit_events(client_id);
CREATE INDEX IF NOT EXISTS idx_client_crm_audit_target     ON client_crm_audit_events(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_client_crm_audit_actor      ON client_crm_audit_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_client_crm_audit_created    ON client_crm_audit_events(created_at);
