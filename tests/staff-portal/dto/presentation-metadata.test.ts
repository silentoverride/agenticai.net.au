import { describe, expect, it } from 'vitest';
import {
  BLOCKED_REASON_PRESENTATION,
  GATE_FINDING_STATE_PRESENTATION,
  REPORT_STATE_PRESENTATION,
  RISK_SIGNAL_PRESENTATION,
  STALE_REASON_PRESENTATION,
  type GateFindingState,
  type ReportState
} from '$lib/staff-portal/dto';
import fs from 'node:fs';
import path from 'node:path';

const reportStates: ReportState[] = [
  'queued',
  'generating',
  'delayed',
  'generated',
  'escalated',
  'inReview',
  'approved',
  'rejected',
  'regenerationRequired',
  'clarificationRequired',
  'conflict',
  'unavailable'
];

const gateFindingStates: GateFindingState[] = [
  'open',
  'inReview',
  'resolved',
  'overriddenWithReason',
  'escalatedFurther',
  'conflict'
];

function expectMetadata(value: { label: string; tone: string; accessibleLabel: string; remediationHint: string; testId: string }) {
  expect(value.label.length).toBeGreaterThan(0);
  expect(value.tone.length).toBeGreaterThan(0);
  expect(value.accessibleLabel.length).toBeGreaterThan(0);
  expect(value.remediationHint.length).toBeGreaterThan(0);
  expect(value.testId.length).toBeGreaterThan(0);
}

describe('Staff Portal presentation metadata', () => {
  it('defines metadata for every governed report state', () => {
    for (const state of reportStates) expectMetadata(REPORT_STATE_PRESENTATION[state]);
  });

  it('defines metadata for every governed gate finding state', () => {
    for (const state of gateFindingStates) expectMetadata(GATE_FINDING_STATE_PRESENTATION[state]);
  });

  it('defines copy for blocked, stale, and risk signals', () => {
    for (const value of Object.values(BLOCKED_REASON_PRESENTATION)) expectMetadata(value);
    for (const value of Object.values(STALE_REASON_PRESENTATION)) expectMetadata(value);
    for (const value of Object.values(RISK_SIGNAL_PRESENTATION)) expectMetadata(value);
  });

  it('does not import server-only modules from the DTO boundary', () => {
    const dtoPath = path.resolve(process.cwd(), 'src/lib/staff-portal/dto.ts');
    const dtoSource = fs.readFileSync(dtoPath, 'utf8');
    expect(dtoSource).not.toContain('$lib/server');
    expect(dtoSource).not.toContain('pipeline_status');
  });
});
