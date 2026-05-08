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
      console.warn(`[pipeline-status-db] D1 set skipped: database unavailable (sessionId=${sessionId})`);
      return;
    }
    const db = getDb();

    try {
      let callId = status.callId || null;
      if (callId) {
        const transcript = await db.queryOne<{ call_id: string }>('SELECT call_id FROM transcripts WHERE call_id = ?', callId);
        callId = transcript ? callId : null;
      }
      let reportId = status.reportId || null;
      if (reportId) {
        const report = await db.queryOne<{ id: string }>('SELECT id FROM reports WHERE id = ?', reportId);
        reportId = report ? reportId : null;
      }

      // Fetch existing attempts
      const existing = await db.queryOne<{ attempts: number }>(
        'SELECT attempts FROM pipeline_status WHERE session_id = ?',
        sessionId
      );
      const attempts = existing ? existing.attempts : 0;

      await db.exec(
        `INSERT INTO pipeline_status (session_id, status, deck_url, report_id, error, attempts, call_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(session_id) DO UPDATE SET
           status = excluded.status,
           deck_url = COALESCE(excluded.deck_url, pipeline_status.deck_url),
           report_id = COALESCE(excluded.report_id, pipeline_status.report_id),
           error = excluded.error,
           attempts = excluded.attempts,
           call_id = COALESCE(excluded.call_id, pipeline_status.call_id),
           updated_at = datetime('now')`,
        sessionId,
        status.status,
        status.deckUrl || null,
        reportId,
        status.error || null,
        status.status === 'error' ? attempts + 1 : attempts,
        callId
      );
      console.info(`[pipeline-status-db] D1 set OK (sessionId=${sessionId}, status=${status.status})`);
    } catch (err) {
      const details = err instanceof Error ? { message: err.message, stack: err.stack } : err;
      console.error(`[pipeline-status-db] D1 set FAILED (sessionId=${sessionId}):`, details);
      throw err;
    }
  }

  async get(sessionId: string): Promise<(PipelineStatus & { attempts?: number }) | undefined> {
    if (!isDatabaseAvailable()) return undefined;
    const db = getDb();
    try {
      const row = await db.queryOne<{
        status: string;
        deck_url: string | null;
        report_id: string | null;
        error: string | null;
        attempts: number;
        call_id: string | null;
      }>(
        'SELECT status, deck_url, report_id, error, attempts, call_id FROM pipeline_status WHERE session_id = ?',
        sessionId
      );
      if (!row) return undefined;
      return {
        status: row.status as PipelineStatus['status'],
        deckUrl: row.deck_url || undefined,
        reportId: row.report_id || undefined,
        error: row.error || undefined,
        attempts: row.attempts,
        callId: row.call_id || undefined
      };
    } catch (err) {
      const details = err instanceof Error ? { message: err.message, stack: err.stack } : err;
      console.error(`[pipeline-status-db] D1 get FAILED (sessionId=${sessionId}):`, details);
      return undefined;
    }
  }
}

export const d1PipelineStatusStore = new D1PipelineStatusStore();
