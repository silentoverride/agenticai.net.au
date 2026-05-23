/**
 * Gate Unit Tests — tests gate infrastructure that does not require API calls.
 */

import { describe, it, expect } from 'vitest';
import { GateVerdict, applyGatePolicy, DEFAULT_GATE_POLICY } from '$lib/server/assessment/gate/types';
import { isGateActive, getGateMode, getGateMaxRetries, normalizeGateType } from '$lib/server/assessment/gate/gate-mode';

describe('Gate Policy Engine', () => {
  it('APPROVE with high confidence returns approve', () => {
    const action = applyGatePolicy(GateVerdict.APPROVE, 0.95, 0, DEFAULT_GATE_POLICY);
    expect(action).toBe('approve');
  });

  it('BLOCK with high confidence escalates', () => {
    const action = applyGatePolicy(GateVerdict.BLOCK, 0.85, 0, DEFAULT_GATE_POLICY);
    expect(action).toBe('escalate');
  });

  it('RETRY with max retries exceeded escalates', () => {
    const action = applyGatePolicy(GateVerdict.RETRY, 0.6, 2, DEFAULT_GATE_POLICY);
    // After max retries, retry should escalate
    expect(action).toBe('escalate');
  });

  it('RETRY with remaining retries returns retry', () => {
    const action = applyGatePolicy(GateVerdict.RETRY, 0.6, 0, DEFAULT_GATE_POLICY);
    expect(action).toBe('retry');
  });

  it('HUMAN_ASSIST returns escalate', () => {
    const action = applyGatePolicy(GateVerdict.HUMAN_ASSIST, 0.5, 0, DEFAULT_GATE_POLICY);
    expect(action).toBe('escalate');
  });

  it('ESCALATE returns escalate', () => {
    const action = applyGatePolicy(GateVerdict.ESCALATE, 0.9, 0, DEFAULT_GATE_POLICY);
    expect(action).toBe('escalate');
  });

  it('low confidence APPROVE with retry remaining returns retry', () => {
    const action = applyGatePolicy(GateVerdict.APPROVE, 0.4, 0, DEFAULT_GATE_POLICY);
    // Confidence 0.4 < 0.7 approveThreshold, retryCount 0 < 2 → RETRY
    expect(action).toBe('retry');
  });

  it('low confidence APPROVE with no retries remaining escalates', () => {
    const action = applyGatePolicy(GateVerdict.APPROVE, 0.3, 2, DEFAULT_GATE_POLICY);
    // Confidence 0.3 < 0.7 approveThreshold, retryCount 2 >= 2 → ESCALATE
    expect(action).toBe('escalate');
  });

  it('low confidence APPROVE with retry remaining returns retry', () => {
    const action = applyGatePolicy(GateVerdict.APPROVE, 0.4, 0, DEFAULT_GATE_POLICY);
    // Confidence 0.4 < 0.7 approveThreshold, retryCount 0 < 2 → RETRY
    expect(action).toBe('retry');
  });

  it('low confidence APPROVE with no retries remaining escalates', () => {
    const action = applyGatePolicy(GateVerdict.APPROVE, 0.3, 2, DEFAULT_GATE_POLICY);
    // Confidence 0.3 < 0.7 approveThreshold, retryCount 2 >= 2 → ESCALATE
    expect(action).toBe('escalate');
  });

  it('BLOCK verdict with escalateOnBlock returns escalate', () => {
    const action = applyGatePolicy(GateVerdict.BLOCK, 0.9, 0, DEFAULT_GATE_POLICY);
    expect(action).toBe('escalate');
  });
});

describe('Gate Mode Configuration', () => {
  it('normalizeGateType converts kebab to upper snake', () => {
    expect(normalizeGateType('quick-wins-verification')).toBe('QUICK_WINS_VERIFICATION');
    expect(normalizeGateType('report-review')).toBe('REPORT_REVIEW');
  });

  it('isGateActive returns true when no env vars set', () => {
    expect(isGateActive('quick-wins-verification', {})).toBe(true);
  });

  it('isGateActive returns false when kill is set', () => {
    expect(isGateActive('quick-wins-verification', {
      GATE_QUICK_WINS_VERIFICATION_KILL: 'true'
    })).toBe(false);
  });

  it('isGateActive returns false when disabled', () => {
    expect(isGateActive('quick-wins-verification', {
      GATE_QUICK_WINS_VERIFICATION_ENABLED: 'false'
    })).toBe(false);
  });

  it('getGateMode returns shadow by default', () => {
    expect(getGateMode({})).toBe('shadow');
  });

  it('getGateMode returns blocking when env var is set', () => {
    expect(getGateMode({ GATE_MODE: 'blocking' })).toBe('blocking');
  });

  it('getGateMode returns shadow when GATE_MODE=shadow', () => {
    expect(getGateMode({ GATE_MODE: 'shadow' })).toBe('shadow');
  });

  it('getGateMaxRetries returns 2 by default', () => {
    expect(getGateMaxRetries({})).toBe(2);
  });

  it('getGateMaxRetries reads from env var', () => {
    expect(getGateMaxRetries({ GATE_MAX_RETRIES: '5' })).toBe(5);
  });

  it('getGateMaxRetries rejects invalid values', () => {
    expect(getGateMaxRetries({ GATE_MAX_RETRIES: 'abc' })).toBe(2);
  });
});

describe('Golden Test Cases', () => {
  it('loads all golden test cases', async () => {
    const { GOLDEN_TEST_CASES } = await import('$lib/server/assessment/calibration/golden-cases');
    expect(GOLDEN_TEST_CASES.length).toBeGreaterThanOrEqual(5);
  });

  it('each case has required fields', async () => {
    const { GOLDEN_TEST_CASES } = await import('$lib/server/assessment/calibration/golden-cases');
    for (const c of GOLDEN_TEST_CASES) {
      expect(c.id).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(c.transcript).toBeTruthy();
      expect(c.expectedVerdicts).toBeTruthy();
      expect(Object.keys(c.expectedVerdicts).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('covers all gate types across cases', async () => {
    const { GOLDEN_TEST_CASES } = await import('$lib/server/assessment/calibration/golden-cases');
    const gateTypes = new Set<string>();
    for (const c of GOLDEN_TEST_CASES) {
      for (const gt of Object.keys(c.expectedVerdicts)) {
        gateTypes.add(gt);
      }
    }
    expect(gateTypes.has('quick-wins-verification')).toBe(true);
    expect(gateTypes.has('report-review')).toBe(true);
  });
});
