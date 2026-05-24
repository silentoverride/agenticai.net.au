import { describe, expect, it } from 'vitest';
import { mapGateFindingState } from '$lib/server/staff-portal/mappers/gate-finding-state';
import { gateFindingFacts } from '$lib/server/staff-portal/testing/builders';

describe('mapGateFindingState', () => {
  it.each(['retry', 'block'])('keeps %s findings open and blocked', (verdict) => {
    const result = mapGateFindingState(gateFindingFacts({ gateVerdict: verdict }));
    expect(result.state).toBe('open');
    expect(result.blockedReasons).toContain('unresolvedBlockingFinding');
  });

  it('maps human assist pending states to escalated or review states', () => {
    expect(mapGateFindingState(gateFindingFacts({ gateVerdict: 'human_assist' })).state).toBe('escalatedFurther');
    expect(mapGateFindingState(gateFindingFacts({ humanAssistStatus: 'in_review' })).state).toBe('inReview');
  });

  it('requires approval evidence before resolving an approved review', () => {
    const resolved = mapGateFindingState(gateFindingFacts({ humanAssistStatus: 'approved', approvalEvidence: true }));
    expect(resolved.state).toBe('resolved');

    const conflict = mapGateFindingState(gateFindingFacts({ humanAssistStatus: 'approved', approvalEvidence: false }));
    expect(conflict.state).toBe('conflict');
    expect(conflict.blockedReasons).toContain('approvalEvidenceRequired');
  });

  it('maps edited/override outcomes and rejected outcomes explicitly', () => {
    expect(mapGateFindingState(gateFindingFacts({ humanAssistStatus: 'edited' })).state).toBe('overriddenWithReason');
    expect(mapGateFindingState(gateFindingFacts({ overrideReason: 'acceptable risk' })).state).toBe('overriddenWithReason');
    expect(mapGateFindingState(gateFindingFacts({ humanAssistStatus: 'rejected' })).state).toBe('escalatedFurther');
  });

  it('surfaces conflicting records', () => {
    const result = mapGateFindingState(gateFindingFacts({ conflict: true }));
    expect(result.state).toBe('conflict');
    expect(result.blockedReasons).toContain('conflictingRecords');
  });
});
