/**
 * Durable Pipeline Status Store — D1-backed
 *
 * Replaces the ephemeral in-memory Map with a D1 table.
 * Enables polling from the assessment success page even after Worker restart.
 */

import { getDb, isDatabaseAvailable } from '$lib/server/db';
import type { PipelineStatus } from './types';

class D1PipelineStatusStore {
  async set(sessionId: string, status: PipelineStatus) {
    if (!isDatabaseAvailable()) {
      console.warn('D1PipelineStatusStore.set skipped: database unavailable');
      return;
    }
    const db = getDb();

    // Fetch existing attempts
    const existing = await db.queryOne<{ attempts: number }>(
      'SELECT attempts FROM pipeline_status WHERE session_id = ?',
      sessionId
    );
    const attempts = existing ? existing.attempts : 0;

    await db.exec(
      `INSERT INTO pipeline_status (session_id, status, deck_url, report_id, error, attempts)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(session_id) DO UPDATE SET
         status = excluded.status,
         deck_url = COALESCE(excluded.deck_url, pipeline_status.deck_url),
         report_id = COALESCE(excluded.report_id, pipeline_status.report_id),
         error = excluded.error,
         attempts = excluded.attempts,
         updated_at = datetime('now')`,
      sessionId,
      status.status,
      status.deckUrl || null,
      status.reportId || null,
      status.error || null,
      status.status === 'error' ? attempts + 1 : attempts
    );
  }

  async get(sessionId: string): Promise<(PipelineStatus & { attempts?: number }) | undefined> {
    if (!isDatabaseAvailable()) return undefined;
    const db = getDb();
    const row = await db.queryOne<{
      status: string;
      deck_url: string | null;
      report_id: string | null;
      error: string | null;
      attempts: number;
    }>(
      'SELECT status, deck_url, report_id, error, attempts FROM pipeline_status WHERE session_id = ?',
      sessionId
    );
    if (!row) return undefined;
    return {
      status: row.status as PipelineStatus['status'],
      deckUrl: row.deck_url || undefined,
      reportId: row.report_id || undefined,
      error: row.error || undefined,
      attempts: row.attempts
    };
  }
}

export const d1PipelineStatusStore = new D1PipelineStatusStore();
