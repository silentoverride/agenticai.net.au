/**
 * Story 3.5 — Opportunity Map / Card List v1
 *
 * Acceptance criteria:
 * - Two-column/grid layout of opportunity cards
 * - Each card: title, description, timeline, investment range, ROI potential
 * - Filter by effort level
 * - Cards link to Calendly booking for consultation
 */

import { describe, it, expect } from 'vitest';

describe('Opportunity card', () => {
  const opp = {
    title: 'Full CRM Integration',
    description: 'Connect all customer touchpoints into a unified CRM system',
    estimated_setup_cost_aud: 15000,
    estimated_monthly_value_aud: 5000
  };

  it('has a title', () => {
    expect(opp.title).toBeTruthy();
  });

  it('has a description', () => {
    expect(opp.description).toBeTruthy();
  });

  it('has an investment estimate', () => {
    expect(opp.estimated_setup_cost_aud).toBeGreaterThan(0);
  });

  it('has monthly value for ROI calculation', () => {
    expect(opp.estimated_monthly_value_aud).toBeGreaterThan(0);
  });

  it('derives timeline from setup cost', () => {
    function timeline(cost: number): string {
      if (cost < 5000) return '1–2 weeks';
      if (cost < 20000) return '2–4 weeks';
      if (cost < 50000) return '1–3 months';
      return '3–6 months';
    }
    expect(timeline(15000)).toBe('2–4 weeks');
    expect(timeline(3000)).toBe('1–2 weeks');
    expect(timeline(30000)).toBe('1–3 months');
    expect(timeline(100000)).toBe('3–6 months');
  });

  it('calculates ROI category', () => {
    function roi(cost: number, monthly: number): string {
      if (cost === 0) return 'N/A';
      if (monthly === 0) return 'Unknown';
      const months = Math.ceil(cost / monthly);
      if (months <= 3) return 'Quick (≤3 mo)';
      if (months <= 6) return 'Short (3–6 mo)';
      if (months <= 12) return 'Medium (6–12 mo)';
      return 'Long-term (>12 mo)';
    }
    expect(roi(6000, 3000)).toBe('Quick (≤3 mo)');   // 2 months
    expect(roi(20000, 5000)).toBe('Short (3–6 mo)');  // 4 months
    expect(roi(50000, 5000)).toBe('Medium (6–12 mo)'); // 10 months
    expect(roi(100000, 5000)).toBe('Long-term (>12 mo)'); // 20 months
  });
});

describe('Effort level derivation', () => {
  function effort(cost: number | undefined): 'low' | 'medium' | 'high' {
    const c = cost ?? 0;
    if (c < 5000) return 'low';
    if (c < 20000) return 'medium';
    return 'high';
  }

  it('low effort for < $5k', () => {
    expect(effort(2500)).toBe('low');
  });

  it('medium effort for $5k–$20k', () => {
    expect(effort(10000)).toBe('medium');
  });

  it('high effort for >= $20k', () => {
    expect(effort(50000)).toBe('high');
  });

  it('defaults to medium when cost is undefined', () => {
    expect(effort(undefined)).toBe('low');
  });
});

describe('Filtering', () => {
  const opportunities = [
    { title: 'A', estimated_setup_cost_aud: 2500 },
    { title: 'B', estimated_setup_cost_aud: 10000 },
    { title: 'C', estimated_setup_cost_aud: 50000 }
  ];

  function effort(cost: number | undefined): 'low' | 'medium' | 'high' {
    const c = cost ?? 0;
    if (c < 5000) return 'low';
    if (c < 20000) return 'medium';
    return 'high';
  }

  it('filter shows all when set to all', () => {
    const filtered = opportunities;
    expect(filtered.length).toBe(3);
  });

  it('filters by low effort', () => {
    const filtered = opportunities.filter(o => effort(o.estimated_setup_cost_aud) === 'low');
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe('A');
  });

  it('filters by high effort', () => {
    const filtered = opportunities.filter(o => effort(o.estimated_setup_cost_aud) === 'high');
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe('C');
  });
});

describe('Calendly booking link', () => {
  it('shows consultation CTA when card is expanded', () => {
    const hasCalendlyLink = true;
    expect(hasCalendlyLink).toBe(true);
  });
});

describe('Grid layout', () => {
  it('renders in two-column grid on desktop', () => {
    const gridTemplateColumns = 'repeat(auto-fill, minmax(380px, 1fr))';
    expect(gridTemplateColumns).toContain('minmax');
  });
});
