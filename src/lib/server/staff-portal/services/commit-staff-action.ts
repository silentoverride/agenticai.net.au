import type { AsyncDb } from '$lib/server/db';
import type {
  StaffActionErrorCode,
  StaffActionMutationErrorDto,
  StaffActionMutationResultDto,
  StaffActionState,
  StaffPortalActionId,
  StaffPortalTargetType
} from '$lib/staff-portal/dto';
import { ACTION_AUDIT_REQUIREMENTS } from '../domain/actions';
import { parseStaffRole, type StaffRole } from '../domain/roles';
import type { GovernedGateFindingState, GovernedReportState } from '../domain/states';
import { GATE_FINDING_STATES, REPORT_STATES } from '../domain/states';
import { mapBrownfieldReportState } from '../mappers/brownfield-report-state';
import { mapGateFindingState } from '../mappers/gate-finding-state';
import { getAvailableActions } from './get-available-actions';
import {
  insertStaffActionAuditEvent,
  staffActionReceiptFromEvent,
  type StaffActionAuditEvent
} from '../repositories/staff-audit.repository';
import { lookupStaffActionIdempotency } from '../repositories/staff-idempotency.repository';
import { createLogger } from './logger';

export interface CommitStaffActionInput {
  db: AsyncDb;
  actorId?: string | null;
  assessmentId: string;
  action: StaffPortalActionId;
  targetType: StaffPortalTargetType;
  targetId?: string | null;
  idempotencyKey: string;
  expectedState: StaffActionState;
  expectedVersion?: string | number;
  reasonCode?: string;
  reason?: string;
  auditMetadata?: Record<string, unknown>;
  now?: () => Date;
  idFactory?: () => string;
  loadCurrentTarget?: CurrentTargetLoader;
}

type CurrentTarget =
  | {
      targetType: 'report';
      state: GovernedReportState;
      version?: string | number | null;
      assignedOperatorId?: string | null;
      targetExists?: boolean;
    }
  | {
      targetType: 'gateFinding';
      state: GovernedGateFindingState;
      version?: string | number | null;
      assignedOperatorId?: string | null;
      targetExists?: boolean;
    };

type CurrentTargetLoader = (input: {
  db: AsyncDb;
  assessmentId: string;
  targetType: StaffPortalTargetType;
  targetId?: string | null;
}) => Promise<CurrentTarget>;

interface UserRoleRow {
  role: string | null;
}

export async function commitStaffAction(input: CommitStaffActionInput): Promise<StaffActionMutationResultDto> {
  const log = createLogger(undefined, input.actorId ?? undefined);
  log.transitionAttempt({
    assessmentId: input.assessmentId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId ?? undefined,
    expectedState: input.expectedState,
    reasonCode: input.reasonCode,
  });

  const actor = await loadActor(input.db, input.actorId);
  if (!actor) {
    log.transitionRejected({
      assessmentId: input.assessmentId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? undefined,
      errorCode: 'permissionDenied',
      detail: 'Operator access required',
    });
    return failure('permissionDenied', 'Operator access required');
  }

  const requestHash = await hashCanonicalRequest(input);
  const idempotency = await lookupStaffActionIdempotency(input.db, {
    actorId: actor.id,
    assessmentId: input.assessmentId,
    idempotencyKey: input.idempotencyKey,
    requestHash
  });

  if (idempotency.status === 'sameRequest') {
    log.idempotencyHit({
      assessmentId: input.assessmentId,
      action: input.action,
      idempotencyKey: input.idempotencyKey,
    });
    return successFromEvent(idempotency.event);
  }
  if (idempotency.status === 'conflict') {
    log.transitionRejected({
      assessmentId: input.assessmentId,
      action: input.action,
      targetType: input.targetType,
      errorCode: 'duplicateAction',
      detail: 'Idempotency key conflict',
    });
    return failure('duplicateAction', 'Idempotency key has already been used for a different action request');
  }

  const current = await (input.loadCurrentTarget ?? loadCurrentTarget)(input);
  const currentState = current.state.state;
  if (current.targetType === 'gateFinding' && current.targetExists === false) {
    log.transitionRejected({
      assessmentId: input.assessmentId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? undefined,
      errorCode: 'blockedAction',
      detail: 'Target gate finding was not found',
    });
    return failure('blockedAction', 'Target gate finding was not found', currentState);
  }
  if (currentState !== input.expectedState) {
    log.staleSubmission({
      assessmentId: input.assessmentId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? undefined,
      expectedState: input.expectedState,
      actualState: currentState,
      detail: `Expected ${input.expectedState}, actual ${currentState}`,
    });
    return failure('staleState', 'Current state no longer matches the expected state', currentState);
  }
  if (input.expectedVersion !== undefined && current.version != null && String(input.expectedVersion) !== String(current.version)) {
    return failure('staleState', 'Current version no longer matches the expected version', currentState);
  }

  const providedAuditMetadata = auditMetadataForEligibility(input, actor.id);
  const actorContext = {
    role: actor.role,
    operatorId: actor.id,
    assignedOperatorId: current.assignedOperatorId,
    sharedQueue: !current.assignedOperatorId
  };
  const actions = current.targetType === 'report'
    ? getAvailableActions({ targetType: 'report', state: current.state, actor: actorContext, providedAuditMetadata })
    : getAvailableActions({ targetType: 'gateFinding', state: current.state, actor: actorContext, providedAuditMetadata });
  const descriptor = actions.find((action) => action.id === input.action && action.targetType === input.targetType);

  if (!descriptor) {
    log.transitionRejected({
      assessmentId: input.assessmentId,
      action: input.action,
      targetType: input.targetType,
      errorCode: 'blockedAction',
      detail: 'Action is not available for this target',
    });
    return failure('blockedAction', 'Action is not available for this target', currentState);
  }
  if (!descriptor.enabled) {
    if (descriptor.blockedReason === 'notAssigned' || descriptor.blockedReason === 'permissionDenied') {
      log.permissionDenied({
        assessmentId: input.assessmentId,
        action: input.action,
        targetType: input.targetType,
        detail: `Blocked reason: ${descriptor.blockedReason}`,
      });
      return failure('permissionDenied', 'You are not allowed to perform this action', currentState);
    }
    if (descriptor.blockedReason === 'auditMetadataRequired') {
      log.transitionRejected({
        assessmentId: input.assessmentId,
        action: input.action,
        targetType: input.targetType,
        errorCode: 'validationFailed',
        detail: 'Required audit metadata is missing',
      });
      return failure('validationFailed', 'Required audit metadata is missing', currentState);
    }
    log.transitionRejected({
      assessmentId: input.assessmentId,
      action: input.action,
      targetType: input.targetType,
      errorCode: 'blockedAction',
      detail: `Action blocked: ${descriptor.blockedReason ?? 'unknown'}`,
    });
    return failure('blockedAction', 'Action is blocked for the current state', currentState);
  }

  const toState = nextState(input.targetType, input.action);
  const eventInput = {
    id: input.idFactory?.() ?? crypto.randomUUID(),
    assessmentId: input.assessmentId,
    targetType: input.targetType,
    targetId: input.targetId ?? null,
    actorId: actor.id,
    action: input.action,
    fromState: currentState,
    toState,
    reasonCode: input.reasonCode ?? null,
    reason: input.reason ?? null,
    requestHash,
    idempotencyKey: input.idempotencyKey,
    metadataJson: serializeMetadata(input.auditMetadata),
    createdAt: (input.now?.() ?? new Date()).toISOString()
  };

  try {
    const event = await insertStaffActionAuditEvent(input.db, eventInput);
    return successFromEvent(event);
  } catch (auditErr) {
    log.auditWriteFailure({
      assessmentId: input.assessmentId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? undefined,
      error: auditErr instanceof Error ? auditErr.message : String(auditErr),
      detail: 'Failed to insert audit event',
    });
    const raced = await lookupStaffActionIdempotency(input.db, {
      actorId: actor.id,
      assessmentId: input.assessmentId,
      idempotencyKey: input.idempotencyKey,
      requestHash
    }).catch(() => ({ status: 'none' as const }));
    if (raced.status === 'sameRequest') return successFromEvent(raced.event);
    if (raced.status === 'conflict') return failure('duplicateAction', 'Idempotency key has already been used for a different action request');
    return failure('auditWriteFailed', 'Audit event could not be persisted; no lifecycle success was recorded', currentState);
  }
}

async function loadActor(db: AsyncDb, actorId: string | null | undefined): Promise<{ id: string; role: StaffRole } | null> {
  if (!actorId) return null;
  const row = await db.queryOne<UserRoleRow>('SELECT role FROM users WHERE clerk_id = ?', actorId);
  const role = parseStaffRole(row?.role);
  return role ? { id: actorId, role } : null;
}

async function loadCurrentTarget(input: {
  db: AsyncDb;
  assessmentId: string;
  targetType: StaffPortalTargetType;
  targetId?: string | null;
}): Promise<CurrentTarget> {
  return input.targetType === 'report' ? loadReportTarget(input) : loadGateFindingTarget(input);
}

async function loadReportTarget(input: { db: AsyncDb; assessmentId: string }): Promise<CurrentTarget> {
  const pipeline = await safeQueryOne<{
    status: string | null;
    deck_url: string | null;
    report_id: string | null;
    updated_at: string | null;
  }>(
    input.db,
    'SELECT status, deck_url, report_id, updated_at FROM pipeline_status WHERE session_id = ? OR report_id = ? ORDER BY updated_at DESC LIMIT 1',
    input.assessmentId,
    input.assessmentId
  );
  const report = await safeQueryOne<{ r2_key: string | null; deck_url: string | null }>(
    input.db,
    'SELECT r2_key, deck_url FROM reports WHERE id = ? OR session_id = ? LIMIT 1',
    input.assessmentId,
    input.assessmentId
  );
  const review = await safeQueryOne<{ status: string | null; operator_id: string | null; created_at: string | null }>(
    input.db,
    'SELECT status, operator_id, created_at FROM human_assist_reviews WHERE assessment_id = ? ORDER BY created_at DESC LIMIT 1',
    input.assessmentId
  );
  const blocking = await safeQueryOne<{ count: number }>(
    input.db,
    "SELECT COUNT(*) AS count FROM assessment_gates WHERE assessment_id = ? AND verdict IN ('block', 'retry', 'escalate', 'human_assist')",
    input.assessmentId
  );

  return {
    targetType: 'report',
    state: mapBrownfieldReportState({
      pipelineStatus: pipeline?.status,
      humanAssistStatus: review?.status,
      artifactPresent: Boolean(report?.r2_key || report?.deck_url || pipeline?.deck_url),
      approvalEvidence: false,
      unresolvedBlockingFindings: blocking?.count ?? 0
    }),
    version: review?.created_at ?? pipeline?.updated_at ?? null,
    assignedOperatorId: review?.operator_id ?? null
  };
}

async function loadGateFindingTarget(input: {
  db: AsyncDb;
  assessmentId: string;
  targetId?: string | null;
}): Promise<CurrentTarget> {
  const gate = input.targetId
    ? await safeQueryOne<{ verdict: string | null; created_at: string | null }>(
        input.db,
        'SELECT verdict, created_at FROM assessment_gates WHERE gate_run_id = ? AND assessment_id = ? LIMIT 1',
        input.targetId,
        input.assessmentId
      )
    : await safeQueryOne<{ verdict: string | null; created_at: string | null }>(
        input.db,
        'SELECT verdict, created_at FROM assessment_gates WHERE assessment_id = ? ORDER BY created_at DESC LIMIT 1',
        input.assessmentId
      );
  const review = await safeQueryOne<{ status: string | null; operator_id: string | null; edited_content: string | null; created_at: string | null }>(
    input.db,
    'SELECT status, operator_id, edited_content, created_at FROM human_assist_reviews WHERE assessment_id = ? ORDER BY created_at DESC LIMIT 1',
    input.assessmentId
  );

  return {
    targetType: 'gateFinding',
    state: mapGateFindingState({
      gateVerdict: gate?.verdict,
      humanAssistStatus: review?.status,
      approvalEvidence: false,
      overrideReason: review?.edited_content
    }),
    version: review?.created_at ?? gate?.created_at ?? null,
    assignedOperatorId: review?.operator_id ?? null,
    targetExists: Boolean(gate)
  };
}

async function safeQueryOne<T>(db: AsyncDb, sql: string, ...params: unknown[]): Promise<T | null> {
  try {
    return await db.queryOne<T>(sql, ...params);
  } catch {
    return null;
  }
}

function nextState(targetType: StaffPortalTargetType, action: StaffPortalActionId): StaffActionState {
  if (targetType === 'report') {
    if (action === 'approveReport') return REPORT_STATES.APPROVED;
    if (action === 'rejectReport') return REPORT_STATES.REJECTED;
    if (action === 'requestClarification') return REPORT_STATES.CLARIFICATION_REQUIRED;
    return REPORT_STATES.REGENERATION_REQUIRED;
  }
  if (action === 'claimFinding') return GATE_FINDING_STATES.IN_REVIEW;
  if (action === 'resolveFinding') return GATE_FINDING_STATES.RESOLVED;
  if (action === 'overrideFinding') return GATE_FINDING_STATES.OVERRIDDEN_WITH_REASON;
  return GATE_FINDING_STATES.ESCALATED_FURTHER;
}

function auditMetadataForEligibility(input: CommitStaffActionInput, actorId: string): Record<string, unknown> {
  return {
    ...input.auditMetadata,
    operatorId: actorId,
    reasonCode: input.reasonCode,
    note: input.reason
  };
}

function serializeMetadata(metadata: Record<string, unknown> | undefined): string | null {
  return metadata ? JSON.stringify(sortObject(metadata)) : null;
}

async function hashCanonicalRequest(input: CommitStaffActionInput): Promise<string> {
  const canonical = JSON.stringify(sortObject({
    assessmentId: input.assessmentId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId ?? null,
    expectedState: input.expectedState,
    expectedVersion: input.expectedVersion ?? null,
    reasonCode: input.reasonCode ?? null,
    reason: input.reason ?? null,
    auditMetadata: input.auditMetadata ?? null,
    requiredAuditMetadata: ACTION_AUDIT_REQUIREMENTS[input.action]
  }));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).sort().reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = sortObject((value as Record<string, unknown>)[key]);
      return acc;
    }, {});
  }
  return value;
}

function successFromEvent(event: StaffActionAuditEvent): StaffActionMutationResultDto {
  return { success: true, receipt: staffActionReceiptFromEvent(event), state: event.toState };
}

function failure(
  code: StaffActionErrorCode,
  message: string,
  currentState?: StaffActionState
): { success: false; error: StaffActionMutationErrorDto } {
  return { success: false, error: { code, message, ...(currentState ? { currentState } : {}) } };
}
