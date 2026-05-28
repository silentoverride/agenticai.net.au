/**
 * Structured JSON Logger for Staff Portal observability.
 *
 * Produces Cloudflare Workers-friendly structured logs with:
 * - Category-based filtering (transitions, permissions, audit, etc.)
 * - Request context (requestId, actorId)
 * - Timestamp in ISO 8601
 * - Machine-parseable JSON output
 *
 * @module logger
 */

import type { StaffRole } from '../domain/roles';
import type { StaffPortalActionId, StaffPortalTargetType } from '$lib/staff-portal/dto';
import type { StaffActionErrorCode } from '$lib/staff-portal/dto';

// ── Log Categories ──────────────────────────────────────────

export const LogCategory = {
  TRANSITION_ATTEMPT: 'transition_attempt',
  TRANSITION_REJECTED: 'transition_rejected',
  STALE_SUBMISSION: 'stale_submission',
  PERMISSION_DENIED: 'permission_denied',
  AUDIT_WRITE_FAILURE: 'audit_write_failure',
  IDEMPOTENCY_HIT: 'idempotency_hit',
  COMMAND_CENTER_ERROR: 'command_center_error',
  BROWNFIELD_MAPPING_CONFLICT: 'brownfield_mapping_conflict',
} as const;

export type LogCategory = (typeof LogCategory)[keyof typeof LogCategory];

// ── Log Entry ───────────────────────────────────────────────

export interface LogEntry {
  ts: string;
  level: 'info' | 'warn' | 'error';
  category: LogCategory;
  message: string;
  requestId?: string;
  actorId?: string;
  actorRole?: StaffRole;
  assessmentId?: string;
  action?: StaffPortalActionId;
  targetType?: StaffPortalTargetType;
  targetId?: string;
  errorCode?: StaffActionErrorCode;
  reasonCode?: string;
  expectedState?: string;
  actualState?: string;
  detail?: string;
  metadata?: Record<string, unknown>;
}

// ── Logger ──────────────────────────────────────────────────

/**
 * Create a structured-logger context bound to a specific request.
 *
 * @param requestId - Correlation ID from the incoming request
 * @param actorId  - Authenticated user ID (if available)
 * @param actorRole - Staff role (if available)
 */
export function createLogger(
  requestId?: string,
  actorId?: string,
  actorRole?: StaffRole,
) {
  function emit(entry: Omit<LogEntry, 'ts' | 'requestId' | 'actorId' | 'actorRole'>): void {
    const full: LogEntry = {
      ts: new Date().toISOString(),
      requestId,
      actorId,
      actorRole,
      ...entry,
    };

    // Structured JSON — Cloudflare Workers and most log aggregators
    // parse this natively. In development, also log a human-readable line.
    const json = JSON.stringify(full);
    switch (full.level) {
      case 'error':
        console.error(json);
        break;
      case 'warn':
        console.warn(json);
        break;
      default:
        console.log(json);
    }
  }

  return {
    /** A state transition was attempted. */
    transitionAttempt(params: {
      assessmentId: string;
      action: StaffPortalActionId;
      targetType: StaffPortalTargetType;
      targetId?: string;
      expectedState: string;
      reasonCode?: string;
      metadata?: Record<string, unknown>;
    }) {
      emit({
        level: 'info',
        category: LogCategory.TRANSITION_ATTEMPT,
        message: `Transition attempt: ${params.action} on ${params.targetType}`,
        ...params,
      });
    },

    /** A transition was rejected by server-side validation. */
    transitionRejected(params: {
      assessmentId: string;
      action: StaffPortalActionId;
      targetType: StaffPortalTargetType;
      targetId?: string;
      errorCode: StaffActionErrorCode;
      reasonCode?: string;
      detail: string;
      metadata?: Record<string, unknown>;
    }) {
      emit({
        level: 'warn',
        category: LogCategory.TRANSITION_REJECTED,
        message: `Transition rejected: ${params.action} (${params.errorCode}) — ${params.detail}`,
        ...params,
      });
    },

    /** A submission was rejected because the target state has changed since page load. */
    staleSubmission(params: {
      assessmentId: string;
      action: StaffPortalActionId;
      targetType: StaffPortalTargetType;
      targetId?: string;
      expectedState: string;
      actualState: string;
      detail: string;
    }) {
      emit({
        level: 'warn',
        category: LogCategory.STALE_SUBMISSION,
        message: `Stale submission: expected ${params.expectedState}, actual ${params.actualState}`,
        ...params,
      });
    },

    /** Permission was denied for an authenticated user. */
    permissionDenied(params: {
      assessmentId?: string;
      action?: StaffPortalActionId;
      targetType?: StaffPortalTargetType;
      detail: string;
      metadata?: Record<string, unknown>;
    }) {
      emit({
        level: 'warn',
        category: LogCategory.PERMISSION_DENIED,
        message: `Permission denied: ${params.detail}`,
        ...params,
      });
    },

    /** An audit event write to the database failed. */
    auditWriteFailure(params: {
      assessmentId: string;
      action: StaffPortalActionId;
      targetType: StaffPortalTargetType;
      targetId?: string;
      error: string;
      detail: string;
    }) {
      emit({
        level: 'error',
        category: LogCategory.AUDIT_WRITE_FAILURE,
        message: `Audit write failure for ${params.action}: ${params.error}`,
        ...params,
      });
    },

    /** An idempotency key was replayed and returned the prior result. */
    idempotencyHit(params: {
      assessmentId: string;
      action: StaffPortalActionId;
      idempotencyKey: string;
    }) {
      emit({
        level: 'info',
        category: LogCategory.IDEMPOTENCY_HIT,
        message: `Idempotency hit: ${params.action} key=${params.idempotencyKey}`,
        ...params,
      });
    },

    /** Command Center read-model derivation encountered an error. */
    commandCenterError(params: {
      error: string;
      detail: string;
      metadata?: Record<string, unknown>;
    }) {
      emit({
        level: 'error',
        category: LogCategory.COMMAND_CENTER_ERROR,
        message: `Command Center derivation error: ${params.error}`,
        ...params,
      });
    },

    /** Brownfield state mapper encountered an incompatible or unknown state. */
    brownfieldMappingConflict(params: {
      assessmentId: string;
      sourceValue: string;
      detail: string;
    }) {
      emit({
        level: 'error',
        category: LogCategory.BROWNFIELD_MAPPING_CONFLICT,
        message: `Brownfield mapping conflict: ${params.sourceValue}`,
        ...params,
      });
    },

    /** Generic info log. */
    info(category: LogCategory, message: string, metadata?: Record<string, unknown>) {
      emit({ level: 'info', category, message, metadata });
    },

    /** Generic warn log. */
    warn(category: LogCategory, message: string, metadata?: Record<string, unknown>) {
      emit({ level: 'warn', category, message, metadata });
    },

    /** Generic error log. */
    error(category: LogCategory, message: string, metadata?: Record<string, unknown>) {
      emit({ level: 'error', category, message, metadata });
    },
  };
}

/** Logger instance with no request context. Suitable for non-request flows. */
export const systemLogger = createLogger();
