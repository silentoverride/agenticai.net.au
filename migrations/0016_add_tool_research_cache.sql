-- Tool research cache table
-- Migrations 0001–0009 reserved for Epic 1, 0010–0019 for Epic 2a

CREATE TABLE IF NOT EXISTS tool_research_cache (
  query_hash TEXT PRIMARY KEY,                   -- SHA-256 hash of the search query
  query_text TEXT NOT NULL,                       -- Original search query
  results_json TEXT NOT NULL,                     -- JSON array of tool results
  tool_count INTEGER NOT NULL DEFAULT 0,          -- Number of tools in results
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL                        -- TTL expiry (created_at + 24h)
);

CREATE INDEX idx_tool_research_cache_expires ON tool_research_cache(expires_at);
