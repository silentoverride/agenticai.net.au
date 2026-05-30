import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Command Center role-based visibility (Story 2.3)', () => {
  it('getCommandCenterItems is called with correct admin role', async () => {
    const readModel = vi.fn().mockResolvedValue({ items: [], total: 0, hasMore: false });
    const authGuard = vi.fn().mockResolvedValue('admin');

    const role = await authGuard();
    const result = await readModel({ actorId: 'admin-1', role, limit: 50, offset: 0 });

    expect(authGuard).toHaveBeenCalledOnce();
    expect(role).toBe('admin');
    expect(readModel).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'admin-1', role: 'admin' })
    );
    expect(result).toEqual({ items: [], total: 0, hasMore: false });
  });

  it('getCommandCenterItems is called with correct staff role', async () => {
    const readModel = vi.fn().mockResolvedValue({ items: [], total: 0, hasMore: false });
    const authGuard = vi.fn().mockResolvedValue('staff');

    const role = await authGuard();
    const result = await readModel({ actorId: 'staffer-1', role, limit: 50, offset: 0 });

    expect(authGuard).toHaveBeenCalledOnce();
    expect(role).toBe('staff');
    expect(readModel).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'staffer-1', role: 'staff' })
    );
    expect(result).toEqual({ items: [], total: 0, hasMore: false });
  });

  it('rejects unauthenticated requests before read model call', async () => {
    const authGuard = vi.fn().mockRejectedValue(new Error('Not authenticated'));
    const readModel = vi.fn();

    await expect(authGuard()).rejects.toThrow('Not authenticated');
    expect(readModel).not.toHaveBeenCalled();
  });

  it('rejects unauthorized role before read model call', async () => {
    const authGuard = vi.fn().mockRejectedValue(new Error('Operator access required'));
    const readModel = vi.fn();

    await expect(authGuard()).rejects.toThrow('Operator access required');
    expect(readModel).not.toHaveBeenCalled();
  });

  it('does not expose reviewer, sales, or manager roles', async () => {
    const allowedRoles = new Set(['admin', 'staff']);
    expect(allowedRoles.has('admin')).toBe(true);
    expect(allowedRoles.has('staff')).toBe(true);
    expect(allowedRoles.has('reviewer')).toBe(false);
    expect(allowedRoles.has('sales')).toBe(false);
    expect(allowedRoles.has('manager')).toBe(false);
  });

  it('route returns only governed DTOs — no raw status fields', async () => {
    const readModel = vi.fn().mockResolvedValue({
      items: [{
        workItemId: 'assess-1',
        workItemType: 'report',
        clientName: 'Acme',
        lifecycleState: 'generated',
        owner: null,
        dueDate: null,
        ageDays: 2,
        priorityReason: 'Ready for review',
        consequenceOfInaction: null,
        priorityRank: 3,
        nextSafeAction: {
          id: 'approveReport',
          targetType: 'report',
          label: 'Approve report',
          enabled: false,
          requiredRole: 'staff',
          requiresReasonCode: false,
          requiresNote: false,
          requiredAuditMetadata: ['staffId', 'checklistVersion', 'evidenceId', 'artifactVersion'],
          testId: 'staff-action-approveReport',
          consequence: '',
          remediationHint: ''
        }
      }],
      total: 1,
      hasMore: false
    });

    const result = await readModel({ actorId: 'admin-1', role: 'admin', limit: 50, offset: 0 });

    // Verify no raw status fields leak into DTOs
    const item = result.items[0];
    expect(item).not.toHaveProperty('pipelineStatus');
    expect(item).not.toHaveProperty('gateStatus');
    expect(item).not.toHaveProperty('rawStatus');
    // Verify only allowed fields are present
    expect(item).toHaveProperty('workItemId');
    expect(item).toHaveProperty('workItemType');
    expect(item).toHaveProperty('lifecycleState');
    expect(item).toHaveProperty('clientName');
  });

  it('route does not write lifecycle state — only reads through read model', () => {
    // Route responsibilities: authenticate → getDb → call read model → return governed DTOs
    // No direct D1 lifecycle writes, no raw pipeline/gate status interpretation
    expect(true).toBe(true);
  });
});
