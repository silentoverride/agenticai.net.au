/**
 * Durable Transcript Store — D1-backed
 *
 * Replaces the ephemeral InMemoryTranscriptStore with a D1 table.
 * All operations are async to match the D1 API.
 *
 * When the database is unavailable (e.g. Cloudflare Workers without D1),
 * operations silently fail and consumers must degrade gracefully.
 */

import { withDb } from '$lib/server/db';
import type { StoredTranscript, TranscriptStore } from './transcript-store-memory';

class D1TranscriptStore implements TranscriptStore {
  async set(callId: string, transcript: string, metadata?: Record<string, unknown>) {
    return withDb('D1TranscriptStore.set', undefined, async db => {
      await db.exec(
        `INSERT INTO transcripts (call_id, transcript, metadata)
         VALUES (?, ?, ?)
         ON CONFLICT(call_id) DO UPDATE SET
           transcript = excluded.transcript,
           metadata = excluded.metadata,
           processed_at = NULL`,
        callId,
        transcript,
        metadata ? JSON.stringify(metadata) : null
      );
    });
  }

  async get(callId: string): Promise<StoredTranscript | undefined> {
    return withDb('D1TranscriptStore.get', undefined, async db => {
      const row = await db.queryOne<{
        call_id: string;
        transcript: string;
        metadata: string | null;
        created_at: string;
      }>(
        'SELECT call_id, transcript, metadata, created_at FROM transcripts WHERE call_id = ?',
        callId
      );
      if (!row) return undefined;
      return {
        transcript: row.transcript,
        metadata: row.metadata ? (() => { try { return JSON.parse(row.metadata); } catch { console.warn(`[transcript-store] Corrupt metadata for call_id=${row.call_id}, ignoring`); return {}; } })() : {},
        timestamp: new Date(row.created_at).getTime()
      };
    });
  }

  async delete(callId: string) {
    return withDb('D1TranscriptStore.delete', undefined, async db => {
      await db.exec('DELETE FROM transcripts WHERE call_id = ?', callId);
    });
  }

  /** Mark a transcript as processed by the pipeline. */
  async markProcessed(callId: string) {
    return withDb('D1TranscriptStore.markProcessed', undefined, async db => {
      await db.exec(
        "UPDATE transcripts SET processed_at = datetime('now') WHERE call_id = ?",
        callId
      );
    });
  }
}

export const d1TranscriptStore: TranscriptStore = new D1TranscriptStore();
