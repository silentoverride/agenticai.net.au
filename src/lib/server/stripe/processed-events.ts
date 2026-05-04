/**
 * Stripe webhook event idempotency guard.
 *
 * Stores processed Stripe event IDs in D1 to prevent duplicate handling
 * when Stripe retries webhooks (its retry schedule is immediate, ~1h,
 * ~12h, ~24h up to 3 days).
 */

import { getDb, isDatabaseAvailable } from '$lib/server/db';

/**
 * Check if an event was already processed.
 * Returns true if already seen (caller should skip).
 */
export async function isEventProcessed(eventId: string): Promise<boolean> {
  if (!isDatabaseAvailable()) return false;
  const db = getDb();
  const row = await db.queryOne<{ 1: number }>(
    'SELECT 1 FROM processed_events WHERE event_id = ?',
    eventId
  );
  return row != null;
}

/**
 * Record an event as processed.
 * Call this after successfully handling the event.
 */
export async function markEventProcessed(eventId: string, eventType: string) {
  if (!isDatabaseAvailable()) return;
  const db = getDb();
  await db.exec(
    `INSERT INTO processed_events (event_id, event_type)
     VALUES (?, ?)
     ON CONFLICT(event_id) DO NOTHING`,
    eventId,
    eventType
  );
}

/**
 * Prune old processed events to prevent indefinite table growth.
 * Should be called periodically (e.g. via a scheduled trigger).
 */
export async function pruneProcessedEvents(olderThanDays = 30) {
  if (!isDatabaseAvailable()) return;
  const db = getDb();
  const result = await db.exec(
    "DELETE FROM processed_events WHERE processed_at < datetime('now', '-? days')",
    olderThanDays
  );
  if (result.changes > 0) {
    console.info('Pruned processed Stripe events', { count: result.changes });
  }
}
