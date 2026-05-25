import type { AsyncDb } from '$lib/server/db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CalendlyConfig {
  calendlyLink: string | null;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * Returns the configured Calendly link for scheduling context.
 *
 * Lookup order:
 * 1. `site_settings` table (if available)
 * 2. `CALENDLY_LINK` env var fallback
 */
export async function getCalendlyConfig(db: AsyncDb): Promise<CalendlyConfig> {
  // Try site_settings table first
  try {
    const row = await db.queryOne<{ value: string }>(
      `SELECT value FROM site_settings WHERE key = 'calendly_link' LIMIT 1`
    );
    if (row?.value) {
      return { calendlyLink: row.value };
    }
  } catch {
    // Table may not exist — fall through to env
  }

  // Fallback to env var
  const envLink = typeof process !== 'undefined' ? process.env.CALENDLY_LINK : undefined;
  if (envLink) {
    return { calendlyLink: envLink };
  }

  return { calendlyLink: null };
}
