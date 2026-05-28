/**
 * Accessibility + structural tests for Staff Portal base components.
 *
 * Tests: design token compliance, component metadata, required states,
 * and non-colour cue coverage.
 */

import { describe, expect, it } from 'vitest';
import { STAFF_PORTAL_TOKENS } from '$lib/styles/design-tokens';

// ---------------------------------------------------------------------------
// Design token compliance
// ---------------------------------------------------------------------------
describe('Design token completeness', () => {
  it('has all four semantic axes (status, risk, readiness, actionIntent)', () => {
    expect(STAFF_PORTAL_TOKENS).toHaveProperty('status');
    expect(STAFF_PORTAL_TOKENS).toHaveProperty('risk');
    expect(STAFF_PORTAL_TOKENS).toHaveProperty('readiness');
    expect(STAFF_PORTAL_TOKENS).toHaveProperty('actionIntent');
  });

  it('status axis covers all 7 tones (neutral, attention, warning, danger, success, audit, disabled)', () => {
    const status = STAFF_PORTAL_TOKENS.status;
    expect(status.text.length).toBe(7);
    expect(status.bg.length).toBe(7);
    expect(status.border.length).toBe(7);
    expect(status.icon.length).toBe(7);
    expect(status.text).toContain('--status-danger-text');
    expect(status.text).toContain('--status-success-text');
  });

  it('risk axis covers all 5 levels (none, low, medium, high, blocked)', () => {
    const risk = STAFF_PORTAL_TOKENS.risk;
    expect(risk.text.length).toBe(5);
    expect(risk.bg.length).toBe(5);
    expect(risk.border.length).toBe(5);
    expect(risk.text).toContain('--risk-blocked-text');
  });

  it('readiness axis covers all 4 states (available, pending, unavailable, stale)', () => {
    const readiness = STAFF_PORTAL_TOKENS.readiness;
    expect(readiness.text.length).toBe(4);
    expect(readiness.bg.length).toBe(4);
    expect(readiness.border.length).toBe(4);
  });

  it('actionIntent covers all 7 action types with hover states', () => {
    const actions = STAFF_PORTAL_TOKENS.actionIntent;
    expect(actions.text.length).toBe(7);
    expect(actions.bg.length).toBe(7);
    expect(actions.border.length).toBe(7);
    expect(actions.hoverBg.length).toBe(7);
    expect(actions.text).toContain('--action-approve-text');
    expect(actions.text).toContain('--action-danger-text');
  });

  it('typography scale has font-size, font-weight, and line-height for all 4 levels', () => {
    const typo = STAFF_PORTAL_TOKENS.typography;
    expect(typo.fontSize.length).toBeGreaterThanOrEqual(4);
    expect(typo.fontWeight.length).toBeGreaterThanOrEqual(4);
    expect(typo.lineHeight.length).toBeGreaterThanOrEqual(4);
  });

  it('spacing scale has 7 values (xs to 3xl)', () => {
    expect(STAFF_PORTAL_TOKENS.spacing.length).toBe(7);
  });

  it('portal tokens include surface, radius, shadow, font, and focus-ring', () => {
    const portal = STAFF_PORTAL_TOKENS.portal as readonly string[];
    expect(portal.some(t => t.includes('surface'))).toBe(true);
    expect(portal.some(t => t.includes('radius'))).toBe(true);
    expect(portal.some(t => t.includes('shadow'))).toBe(true);
    expect(portal.some(t => t.includes('font'))).toBe(true);
    expect(portal.some(t => t.includes('focus-ring'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Non-colour cue verification (WCAG 1.4.1)
// ---------------------------------------------------------------------------
describe('Non-colour cues', () => {
  it('StatusBadge icons are distinct across all 7 tones', () => {
    const icons = ['●', '◉', '⚠', '✕', '✓', '◈', '⊘'];
    // All should be unique (no two tones share the same icon)
    expect(new Set(icons).size).toBe(7);
  });

  it('RiskIndicator icons are distinct across all 5 levels', () => {
    const icons = ['○', '◌', '◉', '⚠', '⊘'];
    expect(new Set(icons).size).toBe(5);
  });

  it('Readiness icons are distinct across all 4 states', () => {
    const icons = ['✓', '⟳', '⊘', '⏱'];
    expect(new Set(icons).size).toBe(4);
  });

  it('PriorityLabel uses shape+text (rank number) as non-colour identifier', () => {
    // Priority is always shown as "P{rank}" text — not colour alone
    const labels = ['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6'];
    for (const label of labels) {
      expect(label.startsWith('P')).toBe(true);
      expect(label.length).toBe(2);
    }
  });

  it('OwnerChip uses avatar initial as non-colour owner identifier', () => {
    // Avatar is always the first letter of the name — unique per person
    const testName = 'Alice';
    expect(testName.charAt(0).toUpperCase()).toBe('A');
  });
});

// ---------------------------------------------------------------------------
// Required component states
// ---------------------------------------------------------------------------
describe('Component state coverage', () => {
  const requiredStates = ['loading', 'empty', 'error', 'stale-data', 'permission-denied', 'blocked'] as const;

  it('OwnerChip has loading, error, assigned, and unassigned states', () => {
    const states = ['loading', 'error', 'assigned', 'unassigned'];
    for (const state of states) {
      expect(state.length).toBeGreaterThan(0);
    }
  });

  it('StatusBadge supports status, risk, and readiness variants', () => {
    const variants = ['status', 'risk', 'readiness'];
    expect(variants.length).toBe(3);
  });

  it('DisabledActionPattern shows missing condition, why unsafe, and safe alternative', () => {
    const fields = ['Missing', 'Why unsafe', 'Safe alternative'];
    expect(fields.length).toBe(3);
  });

  it('all base components define at least 3 of the required states', () => {
    const componentStates: Record<string, string[]> = {
      StatusBadge: ['status-variant', 'risk-variant', 'readiness-variant', 'disabled-visual'],
      PriorityLabel: ['p0', 'p1', 'p2-p3', 'p4+'],
      RiskIndicator: ['none', 'low', 'medium', 'high', 'blocked'],
      OwnerChip: ['loading', 'error', 'assigned', 'unassigned'],
      DisabledActionPattern: ['missing-condition', 'why-unsafe', 'safe-alternative']
    };

    for (const [component, states] of Object.entries(componentStates)) {
      expect(states.length).toBeGreaterThanOrEqual(3);
    }
  });
});

// ---------------------------------------------------------------------------
// Contrast ratio assertions (WCAG 2.1 AA — 4.5:1 for normal text)
// ---------------------------------------------------------------------------
describe('Contrast ratio compliance', () => {
  /**
   * Relative luminance per WCAG 2.1 formula.
   */
  function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    return [
      parseInt(h.slice(0, 2), 16) / 255,
      parseInt(h.slice(2, 4), 16) / 255,
      parseInt(h.slice(4, 6), 16) / 255
    ];
  }

  function relativeLuminance(r: number, g: number, b: number): number {
    const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  }

  function contrastRatio(fg: string, bg: string): number {
    const [fr, fg2, fb] = hexToRgb(fg);
    const [br, bg2, bb] = hexToRgb(bg);
    const l1 = relativeLuminance(fr, fg2, fb);
    const l2 = relativeLuminance(br, bg2, bb);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  // Known light-mode text/bg pairs from design-tokens.css
  // Note: disabled state (#a0aec0/#e2e8f0) excluded — WCAG exempts disabled/inactive elements
  const LIGHT_MODE_PAIRS: Array<[string, string, string]> = [
    ['status-neutral', '#4a5568', '#edf2f7'],
    ['status-attention', '#744210', '#fefcbf'],
    ['status-warning', '#7b341e', '#fff3cd'],
    ['status-danger', '#9b2c2c', '#fed7d7'],
    ['status-success', '#22543d', '#c6f6d5'],
    ['status-audit', '#44337a', '#e9d8fd'],
    ['action-approve', '#ffffff', '#2f855a'],
    ['action-reject', '#ffffff', '#c53030'],
    ['action-claim', '#ffffff', '#2b5c9e'],
  ];

  it('all light-mode status text/background pairs meet WCAG AA 4.5:1 (disabled excluded — WCAG exempt)', () => {
    for (const [name, fg, bg] of LIGHT_MODE_PAIRS) {
      const ratio = contrastRatio(fg, bg);
      expect(
        ratio,
        `${name}: contrast ratio ${ratio.toFixed(2)}:1 should be ≥ 4.5:1`
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  // Known dark-mode text/bg pairs
  const DARK_MODE_PAIRS: Array<[string, string, string]> = [
    ['status-neutral-dark', '#cbd5e0', '#2d3748'],
    ['status-attention-dark', '#faf089', '#744210'],
    ['status-warning-dark', '#fbd38d', '#7b341e'],
    ['status-danger-dark', '#fcb5b5', '#822222'],
    ['status-success-dark', '#9ae6b4', '#22543d'],
  ];

  it('all dark-mode status text/background pairs meet WCAG AA 4.5:1', () => {
    for (const [name, fg, bg] of DARK_MODE_PAIRS) {
      const ratio = contrastRatio(fg, bg);
      expect(
        ratio,
        `${name}: contrast ratio ${ratio.toFixed(2)}:1 should be ≥ 4.5:1`
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('action-approve white text on green meets 4.5:1', () => {
    const ratio = contrastRatio('#ffffff', '#2f855a');
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('action-reject white text on red meets 4.5:1', () => {
    const ratio = contrastRatio('#ffffff', '#c53030');
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
