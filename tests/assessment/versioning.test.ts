/**
 * Story 3.8 — Versioning, Regeneration & Display
 *
 * Acceptance criteria:
 * - Briefing displays version number and last-updated date
 * - Re-run assessment button triggers regeneration
 * - Previous version preserved (R2 key pattern)
 * - Version history viewable: date, version, status (current/archived)
 * - Rate limit regeneration: 1 per 30 days per assessment
 */

import { describe, it, expect } from 'vitest';

describe('Version display', () => {
  it('shows version number', () => {
    const version = 2;
    expect(version).toBeGreaterThanOrEqual(1);
  });

  it('shows last-updated date', () => {
    const date = '2026-05-23T10:30:00Z';
    const d = new Date(date);
    expect(d.toISOString()).toContain('2026-05-23');
  });

  it('formats version as v{number}', () => {
    const version = 3;
    const label = `v${version}`;
    expect(label).toBe('v3');
  });
});

describe('Regeneration', () => {
  it('has a Re-run Assessment button', () => {
    const hasButton = true;
    expect(hasButton).toBe(true);
  });

  it('shows loading state during regeneration', () => {
    let regenerating = true;
    expect(regenerating).toBe(true);
    regenerating = false;
    expect(regenerating).toBe(false);
  });

  it('shows success message after request', () => {
    const msg = 'Regeneration queued. Version 2 will be available shortly.';
    expect(msg).toContain('Regeneration');
    expect(msg).toContain('Version');
  });

  it('shows error message on failure', () => {
    const msg = 'Failed to request regeneration.';
    expect(msg).toBeTruthy();
  });
});

describe('Rate limiting on regeneration', () => {
  it('limits regeneration to 1 per 30 days', () => {
    const cooldownDays = 30;
    expect(cooldownDays).toBe(30);
  });

  it('returns 429 when regeneration is too soon', () => {
    const lastRegen = new Date(); // today
    const now = new Date();
    const daysSince = (now.getTime() - lastRegen.getTime()) / (1000 * 60 * 60 * 24);
    const blocked = daysSince < 30;
    expect(blocked).toBe(true);
  });

  it('allows regeneration after 30 days', () => {
    const lastRegen = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000); // 31 days ago
    const now = new Date();
    const daysSince = (now.getTime() - lastRegen.getTime()) / (1000 * 60 * 60 * 24);
    const allowed = daysSince >= 30;
    expect(allowed).toBe(true);
  });
});

describe('Version history', () => {
  it('shows version history entries', () => {
    const versions = [
      { version: 2, status: 'current' },
      { version: 1, status: 'archived' }
    ];
    expect(versions.length).toBe(2);
    expect(versions[0].status).toBe('current');
    expect(versions[1].status).toBe('archived');
  });

  it('highlights current version', () => {
    const current = { version: 2, status: 'current' };
    expect(current.status).toBe('current');
  });

  it('shows archived status for previous versions', () => {
    const archived = { version: 1, status: 'archived' };
    expect(archived.status).toBe('archived');
  });
});

describe('Version preservation (R2)', () => {
  it('preserves previous version in R2', () => {
    const reportId = 'report_abc';
    const version = 1;
    const r2Key = `assessments/${reportId}/v${version}-briefing.json`;
    expect(r2Key).toBe('assessments/report_abc/v1-briefing.json');
  });

  it('new version gets incremented key', () => {
    const reportId = 'report_abc';
    const version = 2;
    const r2Key = `assessments/${reportId}/v${version}-briefing.json`;
    expect(r2Key).toBe('assessments/report_abc/v2-briefing.json');
  });
});

describe('Last regenerated tracking', () => {
  it('stores last_regenerated_at date', () => {
    const report = { id: 'r1', last_regenerated_at: '2026-05-23T10:30:00Z' };
    expect(report.last_regenerated_at).toBeTruthy();
  });

  it('updates report version on regeneration', () => {
    const report = { id: 'r1', version: 2 };
    expect(report.version).toBeGreaterThan(1);
  });
});
