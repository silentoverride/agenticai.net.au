-- Migration 0024: Site-wide settings table
-- Key-value store for operator-configurable settings (Calendly link, etc).
-- Supports the calendly.service.ts getCalendlyConfig() lookup.
-- Falls back to env var CALENDLY_LINK when no row exists.

CREATE TABLE IF NOT EXISTS site_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
