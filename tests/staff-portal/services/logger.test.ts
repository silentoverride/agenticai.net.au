import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLogger, systemLogger, LogCategory } from '$lib/server/staff-portal/services/logger';

describe('Structured Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('produces valid JSON output for each log level', () => {
    const log = createLogger('req-1', 'actor-1', 'staff');

    log.transitionAttempt({
      assessmentId: 'a1',
      action: 'approveReport',
      targetType: 'report',
      expectedState: 'in_review',
    });

    expect(consoleLogSpy).toHaveBeenCalledOnce();
    const infoJson = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
    expect(infoJson.category).toBe(LogCategory.TRANSITION_ATTEMPT);
    expect(infoJson.level).toBe('info');
    expect(infoJson.requestId).toBe('req-1');
    expect(infoJson.actorId).toBe('actor-1');
    expect(infoJson.actorRole).toBe('staff');
    expect(infoJson.assessmentId).toBe('a1');
    expect(infoJson.action).toBe('approveReport');
    expect(infoJson.targetType).toBe('report');
    expect(infoJson.ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    consoleLogSpy.mockClear();

    log.transitionRejected({
      assessmentId: 'a1',
      action: 'approveReport',
      targetType: 'report',
      errorCode: 'permissionDenied',
      detail: 'Not allowed',
    });

    expect(consoleWarnSpy).toHaveBeenCalledOnce();
    const warnJson = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string);
    expect(warnJson.category).toBe(LogCategory.TRANSITION_REJECTED);
    expect(warnJson.level).toBe('warn');
    expect(warnJson.errorCode).toBe('permissionDenied');

    consoleErrorSpy.mockClear();

    log.auditWriteFailure({
      assessmentId: 'a1',
      action: 'approveReport',
      targetType: 'report',
      error: 'DB down',
      detail: 'Failed to insert',
    });

    expect(consoleErrorSpy).toHaveBeenCalledOnce();
    const errJson = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
    expect(errJson.category).toBe(LogCategory.AUDIT_WRITE_FAILURE);
    expect(errJson.level).toBe('error');
  });

  it('staleSubmission logs expected and actual state', () => {
    const log = createLogger();
    log.staleSubmission({
      assessmentId: 'a1',
      action: 'approveReport',
      targetType: 'report',
      expectedState: 'in_review',
      actualState: 'approved',
      detail: 'State mismatch',
    });

    expect(consoleWarnSpy).toHaveBeenCalledOnce();
    const json = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string);
    expect(json.category).toBe(LogCategory.STALE_SUBMISSION);
    expect(json.expectedState).toBe('in_review');
    expect(json.actualState).toBe('approved');
  });

  it('permissionDenied logs without assessment context', () => {
    const log = createLogger('req-1', 'actor-1');
    log.permissionDenied({
      detail: 'Access denied for non-staff role',
    });

    expect(consoleWarnSpy).toHaveBeenCalledOnce();
    const json = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string);
    expect(json.category).toBe(LogCategory.PERMISSION_DENIED);
    expect(json.requestId).toBe('req-1');
    expect(json.actorId).toBe('actor-1');
  });

  it('idempotencyHit logs key and action', () => {
    const log = createLogger();
    log.idempotencyHit({
      assessmentId: 'a1',
      action: 'approveReport',
      idempotencyKey: 'key-123',
    });

    expect(consoleLogSpy).toHaveBeenCalledOnce();
    const json = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
    expect(json.category).toBe(LogCategory.IDEMPOTENCY_HIT);
  });

  it('systemLogger works without request context', () => {
    systemLogger.warn(LogCategory.TRANSITION_REJECTED, 'Test message', { key: 'value' });

    expect(consoleWarnSpy).toHaveBeenCalledOnce();
    const json = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string);
    expect(json.category).toBe(LogCategory.TRANSITION_REJECTED);
    expect(json.message).toBe('Test message');
    expect(json.requestId).toBeUndefined();
    expect(json.actorId).toBeUndefined();
  });

  it('generic info/warn/error methods work', () => {
    const log = createLogger('r1');
    log.info(LogCategory.TRANSITION_ATTEMPT, 'Generic info');
    log.warn(LogCategory.STALE_SUBMISSION, 'Generic warn');
    log.error(LogCategory.COMMAND_CENTER_ERROR, 'Generic error');

    expect(consoleLogSpy).toHaveBeenCalledOnce();
    expect(consoleWarnSpy).toHaveBeenCalledOnce();
    expect(consoleErrorSpy).toHaveBeenCalledOnce();
  });

  it('includes metadata when provided', () => {
    const log = createLogger();
    log.transitionAttempt({
      assessmentId: 'a1',
      action: 'approveReport',
      targetType: 'report',
      expectedState: 'in_review',
      metadata: { customField: 42 },
    });

    const json = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
    expect(json.metadata).toEqual({ customField: 42 });
  });
});
