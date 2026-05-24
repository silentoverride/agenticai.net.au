import { describe, expect, it } from 'vitest';
import { getAvailableActions } from '$lib/server/staff-portal/services/get-available-actions';
import { mapBrownfieldReportState } from '$lib/server/staff-portal/mappers/brownfield-report-state';
import { mapGateFindingState } from '$lib/server/staff-portal/mappers/gate-finding-state';
import { actionContext, gateFindingFacts, reportFacts } from '$lib/server/staff-portal/testing/builders';
import { isStaffRole, STAFF_ROLES } from '$lib/server/staff-portal/domain/roles';

describe('getAvailableActions', () => {
  it('returns descriptors with audit requirements and disabled reason when audit metadata is missing', () => {
    const state = mapBrownfieldReportState(reportFacts({ pipelineStatus: 'ready', approvalEvidence: false }));
    const actions = getAvailableActions({ targetType: 'report', state, actor: actionContext() });
    const approve = actions.find((action) => action.id === 'approveReport');

    expect(approve).toMatchObject({
      targetType: 'report',
      enabled: false,
      requiredRole: 'operator',
      testId: 'staff-action-approveReport'
    });
    expect(approve?.requiredAuditMetadata).toContain('operatorId');
    expect(approve?.blockedReason).toBeDefined();
  });

  it('blocks approval when unresolved findings remain', () => {
    const state = mapBrownfieldReportState(reportFacts({ unresolvedBlockingFindings: 1 }));
    const approve = getAvailableActions({
      targetType: 'report',
      state,
      actor: actionContext(),
      providedAuditMetadata: { operatorId: 'operator-1', checklistVersion: 'v1', evidenceId: 'e1', artifactVersion: 1 }
    }).find((action) => action.id === 'approveReport');

    expect(approve?.enabled).toBe(false);
    expect(approve?.blockedReason).toBe('unresolvedBlockingFinding');
  });

  it('enforces operator assignment unless admin or shared queue', () => {
    const state = mapGateFindingState(gateFindingFacts({ gateVerdict: 'human_assist' }));
    const assignedElsewhere = getAvailableActions({
      targetType: 'gateFinding',
      state,
      actor: actionContext({ assignedOperatorId: 'someone-else', sharedQueue: false })
    });
    expect(assignedElsewhere.every((action) => action.enabled === false)).toBe(true);
    expect(assignedElsewhere[0].blockedReason).toBe('notAssigned');

    const admin = getAvailableActions({
      targetType: 'gateFinding',
      state,
      actor: actionContext({ role: 'admin', assignedOperatorId: 'someone-else' })
    });
    expect(admin[0].blockedReason).not.toBe('notAssigned');
  });

  it('surfaces stale reasons and disables stale actions', () => {
    const state = mapGateFindingState(gateFindingFacts({ stale: true, gateVerdict: 'human_assist' }));
    const actions = getAvailableActions({ targetType: 'gateFinding', state, actor: actionContext() });
    expect(actions.every((action) => action.enabled === false)).toBe(true);
    expect(actions[0].staleReason).toBe('outOfDateFinding');
  });

  it('accepts only admin and operator as Staff Portal roles', () => {
    expect(STAFF_ROLES).toEqual(['admin', 'operator']);
    expect(isStaffRole('admin')).toBe(true);
    expect(isStaffRole('operator')).toBe(true);
    expect(isStaffRole('reviewer')).toBe(false);
    expect(isStaffRole('sales')).toBe(false);
    expect(isStaffRole('manager')).toBe(false);
  });
});
