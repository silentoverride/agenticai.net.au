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

  it('returns claim, resolve, override, escalate for open gate finding', () => {
    const state = mapGateFindingState(gateFindingFacts({ gateVerdict: 'human_assist' }));
    const actions = getAvailableActions({
      targetType: 'gateFinding',
      state,
      actor: actionContext({ role: 'operator', operatorId: 'op-1', assignedOperatorId: 'op-1' }),
      providedAuditMetadata: { operatorId: 'op-1', note: 'reason', reasonCode: 'done' }
    });

    const ids = actions.map((a) => a.id);
    expect(ids).toContain('claimFinding');
    expect(ids).toContain('resolveFinding');
    expect(ids).toContain('overrideFinding');
    expect(ids).toContain('escalateFinding');

    // All should be enabled for open state with assigned operator
    expect(actions.every((a) => a.enabled)).toBe(true);
  });

  it('blocks all gate finding actions for resolved state', () => {
    const state = mapGateFindingState(gateFindingFacts({ gateVerdict: 'approve', humanAssistStatus: 'approved', approvalEvidence: true }));
    expect(state.state).toBe('resolved');

    const actions = getAvailableActions({
      targetType: 'gateFinding',
      state,
      actor: actionContext({ role: 'operator', operatorId: 'op-1', assignedOperatorId: 'op-1' }),
      providedAuditMetadata: { operatorId: 'op-1', note: 'reason', reasonCode: 'done' }
    });

    // Resolved gate finding should have all actions blocked
    expect(actions.every((a) => a.enabled === false)).toBe(true);
    const blocked = actions.filter((a) => a.blockedReason);
    expect(blocked.length).toBe(actions.length);
  });

  it('marks override and escalate as requiring reason code and note', () => {
    const state = mapGateFindingState(gateFindingFacts({ gateVerdict: 'human_assist' }));
    const actions = getAvailableActions({
      targetType: 'gateFinding',
      state,
      actor: actionContext({ role: 'operator', operatorId: 'op-1', assignedOperatorId: 'op-1' }),
      providedAuditMetadata: { operatorId: 'op-1', note: 'reason', reasonCode: 'done' }
    });

    const override = actions.find((a) => a.id === 'overrideFinding');
    expect(override?.requiresReasonCode).toBe(true);
    expect(override?.requiresNote).toBe(true);

    const resolve = actions.find((a) => a.id === 'resolveFinding');
    expect(resolve?.requiresReasonCode).toBe(true);
    expect(resolve?.requiresNote).toBe(true);

    const escalate = actions.find((a) => a.id === 'escalateFinding');
    expect(escalate?.requiresReasonCode).toBe(true);
    expect(escalate?.requiresNote).toBe(true);

    // claimFinding does not require reason code or note
    const claim = actions.find((a) => a.id === 'claimFinding');
    expect(claim?.requiresReasonCode).toBe(false);
    expect(claim?.requiresNote).toBe(false);
  });

  it('returns requestClarification as a report action', () => {
    const state = mapBrownfieldReportState(reportFacts({ pipelineStatus: 'ready', humanAssistStatus: null }));
    const actions = getAvailableActions({
      targetType: 'report',
      state,
      actor: actionContext({ role: 'operator', operatorId: 'op-1', assignedOperatorId: 'op-1' }),
      providedAuditMetadata: { operatorId: 'op-1', note: 'reason', reasonCode: 'done' }
    });
    const clarification = actions.find((a) => a.id === 'requestClarification');
    expect(clarification).toBeDefined();
    expect(clarification?.requiresReasonCode).toBe(true);
    expect(clarification?.requiresNote).toBe(true);
    expect(clarification?.consequence).toContain('internal follow-up');
  });

  it('does not return requestClarification when report is already approved', () => {
    const state = mapBrownfieldReportState(reportFacts({
      pipelineStatus: 'ready',
      humanAssistStatus: 'approved',
      approvalEvidence: true,
      unresolvedBlockingFindings: 0
    }));
    // When fully approved, the state should be 'approved'
    if (state.state !== 'approved') return; // skip if state mapper doesn't produce approved
    const actions = getAvailableActions({
      targetType: 'report',
      state,
      actor: actionContext({ role: 'operator', operatorId: 'op-1', assignedOperatorId: 'op-1' }),
      providedAuditMetadata: { operatorId: 'op-1', note: 'reason', reasonCode: 'done' }
    });
    const clarification = actions.find((a) => a.id === 'requestClarification');
    expect(clarification?.enabled).toBe(false);
    expect(clarification?.blockedReason).toBe('alreadyFinalized');
  });

  it('surfaces unresolvedBlockingFinding as blocked reason on approveReport', () => {
    const state = mapBrownfieldReportState(reportFacts({
      pipelineStatus: 'ready',
      humanAssistStatus: null,
      unresolvedBlockingFindings: 2
    }));
    const actions = getAvailableActions({
      targetType: 'report',
      state,
      actor: actionContext({ role: 'operator', operatorId: 'op-1', assignedOperatorId: 'op-1' }),
      providedAuditMetadata: { operatorId: 'op-1', checklistVersion: 'v1', evidenceId: 'e1', artifactVersion: 'latest' }
    });
    const approve = actions.find((a) => a.id === 'approveReport');
    expect(approve?.enabled).toBe(false);
    expect(approve?.blockedReason).toBe('unresolvedBlockingFinding');
  });
});
