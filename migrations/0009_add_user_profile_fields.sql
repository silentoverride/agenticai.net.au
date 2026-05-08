-- Migration 0009: Add business profile fields to users.

ALTER TABLE users ADD COLUMN company TEXT;
ALTER TABLE users ADD COLUMN address TEXT;
ALTER TABLE users ADD COLUMN avatar TEXT;
ALTER TABLE users ADD COLUMN abn TEXT;
ALTER TABLE users ADD COLUMN acn TEXT;
ALTER TABLE users ADD COLUMN website TEXT;
