import type { BrownfieldReportStateInput } from '../mappers/brownfield-report-state';
import type { GateFindingStateInput } from '../mappers/gate-finding-state';
import type { GetAvailableActionsInput } from '../services/get-available-actions';

export function reportFacts(overrides: BrownfieldReportStateInput = {}): BrownfieldReportStateInput {
  return {
    pipelineStatus: 'ready',
    artifactPresent: true,
    approvalEvidence: false,
    unresolvedBlockingFindings: 0,
    ...overrides
  };
}

export function gateFindingFacts(overrides: GateFindingStateInput = {}): GateFindingStateInput {
  return {
    gateVerdict: 'block',
    approvalEvidence: false,
    ...overrides
  };
}

export function actionContext(overrides: Partial<GetAvailableActionsInput['actor']> = {}): GetAvailableActionsInput['actor'] {
  return {
    role: 'operator',
    operatorId: 'operator-1',
    assignedOperatorId: 'operator-1',
    sharedQueue: false,
    ...overrides
  };
}
