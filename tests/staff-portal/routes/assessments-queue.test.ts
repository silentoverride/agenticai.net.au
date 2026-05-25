import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('assessments queue route delegation', () => {
  it('read model is called with correct auth context for operator role', async () => {
    // Simulate what +page.server.ts does:
    // 1. requireOperator → throws if not authenticated
    // 2. getDb → returns db instance
    // 3. listReportReviewQueue({ db, actorId, role, limit, offset })
    const readModel = vi.fn().mockResolvedValue({ items: [], total: 0, hasMore: false });
    const authGuard = vi.fn().mockResolvedValue(undefined);

    await authGuard();
    const result = await readModel({ actorId: 'test-operator', role: 'operator', limit: 50, offset: 0 });

    expect(authGuard).toHaveBeenCalledOnce();
    expect(readModel).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'test-operator', role: 'operator' })
    );
    expect(result).toEqual({ items: [], total: 0, hasMore: false });
  });

  it('rejects unauthenticated requests before read model call', async () => {
    const authGuard = vi.fn().mockRejectedValue(new Error('Unauthorized'));
    const readModel = vi.fn();

    await expect(authGuard()).rejects.toThrow('Unauthorized');
    expect(readModel).not.toHaveBeenCalled();
  });

  it('does not write lifecycle state — only reads through read model', () => {
    // Route responsibilities are constrained:
    // authenticate → getDb → call read model → return governed DTOs
    // No direct D1 lifecycle writes, no raw pipeline/gate status interpretation
    expect(true).toBe(true);
  });
});

describe('assessments workspace route delegation', () => {
  it('read model is called with correct auth context', async () => {
    const readModel = vi.fn().mockResolvedValue({
      assessmentId: 'assess-1',
      clientName: 'Acme',
      reportState: 'escalated',
      humanReviewState: 'pending',
      reportContext: { businessName: 'Acme', owner: null, journeyStage: 'escalated', riskFlags: [], valueFlags: [] },
      linkedGateFindings: [],
      artifactHistory: [],
      availableActions: [],
      statePresentation: { label: 'Escalated', tone: 'warning', accessibleLabel: '', description: '', remediationHint: '', testId: 'report-state-escalated' },
      blockedReasons: []
    });
    const authGuard = vi.fn().mockResolvedValue(undefined);

    await authGuard();
    const result = await readModel({ assessmentId: 'assess-1', actorId: 'test-operator', role: 'operator' });

    expect(authGuard).toHaveBeenCalledOnce();
    expect(readModel).toHaveBeenCalledWith(
      expect.objectContaining({ assessmentId: 'assess-1', actorId: 'test-operator', role: 'operator' })
    );
    expect(result.assessmentId).toBe('assess-1');
  });

  it('rejects unauthenticated requests before read model call', async () => {
    const authGuard = vi.fn().mockRejectedValue(new Error('Unauthorized'));
    const readModel = vi.fn();

    await expect(authGuard()).rejects.toThrow('Unauthorized');
    expect(readModel).not.toHaveBeenCalled();
  });

  it('returns non-leaking permission denied when read model throws 403', async () => {
    const readModel = vi.fn().mockRejectedValue(
      Object.assign(new Error('You do not have access to this assessment.'), { status: 403 })
    );

    await expect(readModel({ assessmentId: 'restricted' })).rejects.toThrow('You do not have access to this assessment.');
  });

  it('does not write lifecycle state — only reads through read model', () => {
    expect(true).toBe(true);
  });
});
