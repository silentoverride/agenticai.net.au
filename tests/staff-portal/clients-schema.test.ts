/**
 * Tests for the Clients CRM Zod schemas.
 *
 * These are pure unit tests; they don't require a database.
 * DB-touching code (repositories, services) is covered by integration
 * tests in a follow-up story; the Zod schemas are the highest-leverage
 * surface to test in isolation.
 */

import { describe, it, expect } from 'vitest';
import {
  clientCompanySchema,
  clientFileMetaSchema,
  clientInteractionSchema,
  clientTaskSchema,
  clientUpdateSchema,
  clientInteractionUpdateSchema,
  clientTaskUpdateSchema
} from '../../src/lib/staff-portal/clients.dto';

describe('clientCompanySchema', () => {
  it('accepts a minimal valid company', () => {
    const result = clientCompanySchema.safeParse({ companyName: 'Acme Pty Ltd' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.companyName).toBe('Acme Pty Ltd');
      expect(result.data.status).toBe('active');
      expect(result.data.tags).toEqual([]);
      expect(result.data.customFields).toEqual({});
    }
  });

  it('rejects an empty company name', () => {
    const result = clientCompanySchema.safeParse({ companyName: '   ' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = clientCompanySchema.safeParse({
      companyName: 'Acme',
      email: 'not-an-email'
    });
    expect(result.success).toBe(false);
  });

  it('accepts an empty string for optional email (treated as null)', () => {
    const result = clientCompanySchema.safeParse({
      companyName: 'Acme',
      email: ''
    });
    expect(result.success).toBe(true);
  });

  it('rejects more than 20 tags', () => {
    const tags = Array.from({ length: 21 }, (_, i) => `tag${i}`);
    const result = clientCompanySchema.safeParse({ companyName: 'Acme', tags });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown status', () => {
    const result = clientCompanySchema.safeParse({
      companyName: 'Acme',
      status: 'unknown'
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown industry', () => {
    const result = clientCompanySchema.safeParse({
      companyName: 'Acme',
      industry: 'nope'
    });
    expect(result.success).toBe(false);
  });

  it('trims whitespace in company name', () => {
    const result = clientCompanySchema.safeParse({ companyName: '  Acme  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.companyName).toBe('Acme');
    }
  });
});

describe('clientFileMetaSchema', () => {
  it('defaults category to "other"', () => {
    const result = clientFileMetaSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.category).toBe('other');
  });

  it('accepts each documented category', () => {
    for (const category of [
      'recording',
      'report',
      'contract',
      'invoice',
      'signed-document',
      'note',
      'other'
    ]) {
      const result = clientFileMetaSchema.safeParse({ category });
      expect(result.success).toBe(true);
    }
  });

  it('rejects an unknown category', () => {
    const result = clientFileMetaSchema.safeParse({ category: 'bogus' });
    expect(result.success).toBe(false);
  });
});

describe('clientInteractionSchema', () => {
  it('requires type, summary, occurredAt', () => {
    const result = clientInteractionSchema.safeParse({
      type: 'phone',
      summary: 'Discussed Q2 goals',
      occurredAt: '2026-06-05T10:00:00.000Z'
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty summary', () => {
    const result = clientInteractionSchema.safeParse({
      type: 'phone',
      summary: '   ',
      occurredAt: '2026-06-05T10:00:00.000Z'
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown type', () => {
    const result = clientInteractionSchema.safeParse({
      type: 'telepathy',
      summary: 'x',
      occurredAt: '2026-06-05T10:00:00.000Z'
    });
    expect(result.success).toBe(false);
  });
});

describe('clientTaskSchema', () => {
  it('accepts a minimal task', () => {
    const result = clientTaskSchema.safeParse({
      type: 'task',
      title: 'Send proposal',
      dueAt: '2026-06-10T09:00:00.000Z'
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('open');
      expect(result.data.priority).toBe('normal');
    }
  });

  it('rejects an empty title', () => {
    const result = clientTaskSchema.safeParse({
      type: 'task',
      title: '',
      dueAt: '2026-06-10T09:00:00.000Z'
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown priority', () => {
    const result = clientTaskSchema.safeParse({
      type: 'task',
      title: 'X',
      dueAt: '2026-06-10T09:00:00.000Z',
      priority: 'critical'
    });
    expect(result.success).toBe(false);
  });
});

describe('update schemas (all fields optional)', () => {
  it('clientUpdateSchema accepts an empty patch', () => {
    const result = clientUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('clientInteractionUpdateSchema accepts a single-field patch', () => {
    const result = clientInteractionUpdateSchema.safeParse({ summary: 'Updated' });
    expect(result.success).toBe(true);
  });

  it('clientTaskUpdateSchema accepts a single-field patch', () => {
    const result = clientTaskUpdateSchema.safeParse({ status: 'completed' });
    expect(result.success).toBe(true);
  });
});
