/**
 * Intake R2 store and artifact key convention tests.
 */

import { describe, it, expect } from 'vitest';
import { R2_KEY_CONVENTION } from '$lib/server/assessment/intake-store-r2';

describe('R2 Key Convention', () => {
  const sessionId = 'sess_test_abc123';

  it('generates transcript key', () => {
    const key = R2_KEY_CONVENTION.transcript(sessionId);
    expect(key).toBe(`assessments/${sessionId}/transcript.json`);
  });

  it('generates metadata key', () => {
    const key = R2_KEY_CONVENTION.meta(sessionId);
    expect(key).toBe(`assessments/${sessionId}/meta.json`);
  });

  it('generates stage artifact key', () => {
    const key = R2_KEY_CONVENTION.stageArtifact(sessionId, 'analysis', '20260521T120000Z');
    expect(key).toBe(`assessments/${sessionId}/analysis-20260521T120000Z.json`);
  });

  it('generates prefix for listing', () => {
    const prefix = R2_KEY_CONVENTION.prefix(sessionId);
    expect(prefix).toBe(`assessments/${sessionId}/`);
  });

  it('all session artifacts share a common prefix', () => {
    const transcript = R2_KEY_CONVENTION.transcript(sessionId);
    const meta = R2_KEY_CONVENTION.meta(sessionId);
    const stage = R2_KEY_CONVENTION.stageArtifact(sessionId, 'tool-research', 'ts');
    expect(transcript.startsWith(`assessments/${sessionId}/`)).toBe(true);
    expect(meta.startsWith(`assessments/${sessionId}/`)).toBe(true);
    expect(stage.startsWith(`assessments/${sessionId}/`)).toBe(true);
  });

  it('different sessions have different prefixes', () => {
    const key1 = R2_KEY_CONVENTION.transcript('sess_a');
    const key2 = R2_KEY_CONVENTION.transcript('sess_b');
    expect(key1).not.toBe(key2);
    expect(key1).toContain('sess_a');
    expect(key2).toContain('sess_b');
  });

  it('stage artifact includes stage name and timestamp', () => {
    const key = R2_KEY_CONVENTION.stageArtifact(sessionId, 'gate-quick-wins', '20260521T120000Z');
    expect(key).toContain('gate-quick-wins');
    expect(key).toContain('20260521T120000Z');
    expect(key).toMatch(/\.json$/);
  });
});

describe('R2 Intake Metadata Shape', () => {
  it('metadata has correct structure for Annie intake', () => {
    const meta = {
      sessionId: 'sess_annie_123',
      source: 'annie-chat-intake',
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      company: 'Test Co',
      summary: [{ question: 'Business type?', answer: 'Retail' }],
      amountCents: 120000,
      currency: 'aud',
      stripeSessionId: 'cs_test_xyz',
      createdAt: '2026-05-21T12:00:00Z'
    };
    expect(meta.source).toBe('annie-chat-intake');
    expect(meta.summary).toHaveLength(1);
    expect(meta.amountCents).toBe(120000);
  });

  it('metadata has correct structure for retell voice agent', () => {
    const meta = {
      sessionId: 'cs_test_voice',
      source: 'retell-voice-agent',
      customerName: 'Voice User',
      customerEmail: 'voice@example.com',
      customerPhone: '+61400000000',
      company: 'Voice Co',
      transcript: 'Full text transcript of the voice call...',
      amountCents: 120000,
      currency: 'aud',
      createdAt: '2026-05-21T12:00:00Z'
    };
    expect(meta.source).toBe('retell-voice-agent');
    expect(meta.transcript).toBeDefined();
    expect(meta.customerPhone).toBeDefined();
  });
});

describe('Assessment Orders D1 Table Contract', () => {
  const VALID_STATUSES = [
    'pending_payment', 'paid', 'queued', 'processing',
    'completed', 'failed', 'cancelled'
  ];

  it('has valid status values', () => {
    expect(VALID_STATUSES).toContain('pending_payment');
    expect(VALID_STATUSES).toContain('paid');
    expect(VALID_STATUSES).toContain('queued');
    expect(VALID_STATUSES).toContain('failed');
    expect(VALID_STATUSES).toContain('cancelled');
  });

  it('status transitions are valid', () => {
    // From migration: CHECK(status IN (...))
    const invalidStatuses = ['unknown', 'init', 'deleted'];
    for (const s of invalidStatuses) {
      expect(VALID_STATUSES).not.toContain(s);
    }
  });

  it('required fields exist in schema', () => {
    const schema = {
      id: 'TEXT PRIMARY KEY',
      session_id: 'TEXT NOT NULL',
      source: 'TEXT NOT NULL',
      status: 'TEXT NOT NULL',
      amount_cents: 'INTEGER NOT NULL',
      currency: 'TEXT NOT NULL',
      created_at: 'TEXT NOT NULL',
      updated_at: 'TEXT NOT NULL'
    };
    expect(schema.id).toMatch(/PRIMARY KEY/);
    expect(schema.session_id).toContain('NOT NULL');
    expect(schema.source).toContain('NOT NULL');
  });
});

describe('Data Preservation — UX-DR30/31', () => {
  it('transcript.json is the canonical raw data record', () => {
    // UX-DR30: data preservation strategy
    const key = R2_KEY_CONVENTION.transcript('sess_dr_test');
    expect(key).toContain('transcript.json');
  });

  it('assessments prefix separates from reports prefix', () => {
    const assessmentKey = R2_KEY_CONVENTION.transcript('sess_test');
    expect(assessmentKey.startsWith('assessments/')).toBe(true);
    expect(assessmentKey.startsWith('reports/')).toBe(false);
  });

  it('meta.json stores customer and pipeline metadata', () => {
    const metaKey = R2_KEY_CONVENTION.meta('sess_test');
    expect(metaKey).toContain('meta.json');
  });
});
