/**
 * Unified transcript store — D1-backed with graceful fallback
 *
 * In production (D1 wired) transcripts are written to the D1 `transcripts` table.
 * In local dev or when D1 is down, falls back to in-memory storage
 * so that `node:fs` reports and other routes still function.
 */

import type { StoredTranscript } from './transcript-store-memory';
import { d1TranscriptStore } from './transcript-store-db';
import { isDatabaseAvailable } from '$lib/server/db';
import { InMemoryTranscriptStore } from './transcript-store-memory';

// Fallback in-memory store for local dev / CI where D1 is not bound
const fallbackStore = new InMemoryTranscriptStore();

export async function storeTranscript(callId: string, transcript: string, metadata?: Record<string, unknown>) {
  if (isDatabaseAvailable()) {
    await d1TranscriptStore.set(callId, transcript, metadata);
  } else {
    fallbackStore.set(callId, transcript, metadata);
  }
}

export async function getTranscript(callId: string): Promise<StoredTranscript | undefined> {
  if (isDatabaseAvailable()) {
    return d1TranscriptStore.get(callId);
  }
  return fallbackStore.get(callId);
}

export async function deleteTranscript(callId: string) {
  if (isDatabaseAvailable()) {
    await d1TranscriptStore.delete(callId);
  }
  fallbackStore.delete(callId);
}

