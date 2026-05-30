import type { RequestEvent } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  commitStaffAction: vi.fn(),
  getDb: vi.fn(() => ({ tag: 'db' })),
  setD1Binding: vi.fn(),
  requireOperator: vi.fn()
}));

vi.mock('$lib/server/staff-portal/services/commit-staff-action', () => ({
  commitStaffAction: mocks.commitStaffAction
}));
vi.mock('$lib/server/db', () => ({
  getDb: mocks.getDb,
  setD1Binding: mocks.setD1Binding
}));
vi.mock('$lib/server/staff-auth', () => ({
  requireOperator: mocks.requireOperator
}));

const { POST } = await import('../../../src/routes/api/staff/assessments/[assessmentId]/actions/+server');

describe('assessment actions route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.commitStaffAction.mockResolvedValue({
      success: true,
      state: 'inReview',
      receipt: { id: 'event-1', assessmentId: 'assessment-1' }
    });
  });

  it('rejects unauthenticated requests before the service call', async () => {
    const response = await POST(event({ userId: null }));
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ success: false, error: { code: 'permissionDenied' } });
    expect(mocks.commitStaffAction).not.toHaveBeenCalled();
  });

  it('validates malformed JSON and null bodies', async () => {
    const malformed = await POST(event({ body: 'not-json' }));
    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toMatchObject({ success: false, error: { code: 'validationFailed' } });

    const nullBody = await POST(event({ rawBody: null }));
    expect(nullBody.status).toBe(400);
    expect(await nullBody.json()).toMatchObject({ success: false, error: { code: 'validationFailed' } });
  });

  it('validates missing fields and wrong primitive types', async () => {
    const missing = await POST(event({ rawBody: { action: 'claimFinding' } }));
    expect(missing.status).toBe(400);

    const wrongType = await POST(event({ rawBody: { ...validBody(), idempotencyKey: 123 } }));
    expect(wrongType.status).toBe(400);
    expect(mocks.commitStaffAction).not.toHaveBeenCalled();
  });

  it('delegates validated requests to commitStaffAction without route lifecycle writes', async () => {
    const response = await POST(event());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, state: 'inReview' });
    expect(mocks.requireOperator).toHaveBeenCalledOnce();
    expect(mocks.getDb).toHaveBeenCalledOnce();
    expect(mocks.commitStaffAction).toHaveBeenCalledWith(expect.objectContaining({
      db: { tag: 'db' },
      actorId: 'staffer-1',
      assessmentId: 'assessment-1',
      action: 'claimFinding',
      targetType: 'gateFinding'
    }));
  });

  it('maps service errors to structured status codes', async () => {
    mocks.commitStaffAction.mockResolvedValueOnce({
      success: false,
      error: { code: 'auditWriteFailed', message: 'Audit failed', currentState: 'open' }
    });
    const response = await POST(event());
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ success: false, error: { code: 'auditWriteFailed' } });
  });
});

function validBody() {
  return {
    action: 'claimFinding',
    targetType: 'gateFinding',
    targetId: 'gate-1',
    idempotencyKey: 'idem-1',
    expectedState: 'open'
  };
}

function event(options: {
  userId?: string | null;
  body?: string;
  rawBody?: unknown;
} = {}): RequestEvent<{ assessmentId: string }, '/api/staff/assessments/[assessmentId]/actions'> {
  const body = options.body ?? JSON.stringify(options.rawBody === undefined ? validBody() : options.rawBody);
  return {
    request: new Request('http://localhost/api/staff/assessments/assessment-1/actions', {
      method: 'POST',
      body
    }),
    params: { assessmentId: 'assessment-1' },
    locals: { auth: () => ({ userId: options.userId === undefined ? 'staffer-1' : options.userId }) },
    platform: { env: { assessment_db: undefined } }
  } as unknown as RequestEvent<{ assessmentId: string }, '/api/staff/assessments/[assessmentId]/actions'>;
}
