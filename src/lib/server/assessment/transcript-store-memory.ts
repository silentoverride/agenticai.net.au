/**
 * In-memory transcript store — fallback for local dev / CI where D1 is not wired.
 */

export interface StoredTranscript {
  transcript: string;
  metadata: Record<string, unknown>;
  timestamp: number;
}

export interface TranscriptStore {
  set(callId: string, transcript: string, metadata?: Record<string, unknown>): void | Promise<void>;
  get(callId: string): StoredTranscript | undefined | Promise<StoredTranscript | undefined>;
  delete(callId: string): void | Promise<void>;
}

export class InMemoryTranscriptStore implements TranscriptStore {
  private readonly store = new Map<string, StoredTranscript>();

  set(callId: string, transcript: string, metadata?: Record<string, unknown>) {
    this.store.set(callId, {
      transcript,
      metadata: metadata || {},
      timestamp: Date.now()
    });
  }

  get(callId: string) {
    return this.store.get(callId);
  }

  delete(callId: string) {
    this.store.delete(callId);
  }
}
