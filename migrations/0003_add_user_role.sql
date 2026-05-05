-- Migration 0003: Add role column to users table for future CRM staff access control

ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'client';

-- Add index for quick staff lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Backfill existing users as clients
UPDATE users SET role = 'client' WHERE role IS NULL;
