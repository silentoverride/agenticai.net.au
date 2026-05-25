import type { AsyncDb } from '$lib/server/db';
import type {
  StaffActionReceiptDto,
  StaffActionState,
  StaffPortalActionId,
  StaffPortalTargetType
} from '$lib/staff-portal/dto';

export interface StaffActionAuditEventRow {
  id: string;
  assessment_id: string;
  target_type: string;
  target_id: string | null;
  actor_id: string;
  action: string;
  from_state: string;
  to_state: string;
  reason_code: string | null;
  reason: string | null;
  request_hash: string;
  idempotency_key: string;
  metadata_json: string | null;
  created_at: string;
}

export interface StaffActionAuditEvent {
  id: string;
  assessmentId: string;
  targetType: StaffPortalTargetType;
  targetId: string | null;
  actorId: string;
  action: StaffPortalActionId;
  fromState: StaffActionState;
  toState: StaffActionState;
  reasonCode: string | null;
  reason: string | null;
  requestHash: string;
  idempotencyKey: string;
  metadataJson: string | null;
  createdAt: string;
}

export interface InsertStaffActionAuditEventInput {
  id: string;
  assessmentId: string;
  targetType: StaffPortalTargetType;
  targetId?: string | null;
  actorId: string;
  action: StaffPortalActionId;
  fromState: StaffActionState;
  toState: StaffActionState;
  reasonCode?: string | null;
  reason?: string | null;
  requestHash: string;
  idempotencyKey: string;
  metadataJson?: string | null;
  createdAt: string;
}

export async function insertStaffActionAuditEvent(
  db: AsyncDb,
  input: InsertStaffActionAuditEventInput
): Promise<StaffActionAuditEvent> {
  await db.exec(
    `INSERT INTO staff_action_audit_events (
      id, assessment_id, target_type, target_id, actor_id, action,
      from_state, to_state, reason_code, reason, request_hash,
      idempotency_key, metadata_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.id,
    input.assessmentId,
    input.targetType,
    input.targetId ?? null,
    input.actorId,
    input.action,
    input.fromState,
    input.toState,
    input.reasonCode ?? null,
    input.reason ?? null,
    input.requestHash,
    input.idempotencyKey,
    input.metadataJson ?? null,
    input.createdAt
  );

  const row = await db.queryOne<StaffActionAuditEventRow>(
    'SELECT * FROM staff_action_audit_events WHERE id = ?',
    input.id
  );
  if (!row) throw new Error('Inserted staff action audit event was not found');
  return mapStaffActionAuditEventRow(row);
}

export async function findStaffActionAuditEventByIdempotency(
  db: AsyncDb,
  input: { actorId: string; assessmentId: string; idempotencyKey: string }
): Promise<StaffActionAuditEvent | null> {
  const row = await db.queryOne<StaffActionAuditEventRow>(
    `SELECT * FROM staff_action_audit_events
     WHERE actor_id = ? AND assessment_id = ? AND idempotency_key = ?`,
    input.actorId,
    input.assessmentId,
    input.idempotencyKey
  );
  return row ? mapStaffActionAuditEventRow(row) : null;
}

export function mapStaffActionAuditEventRow(row: StaffActionAuditEventRow): StaffActionAuditEvent {
  return {
    id: row.id,
    assessmentId: row.assessment_id,
    targetType: row.target_type as StaffPortalTargetType,
    targetId: row.target_id,
    actorId: row.actor_id,
    action: row.action as StaffPortalActionId,
    fromState: row.from_state as StaffActionState,
    toState: row.to_state as StaffActionState,
    reasonCode: row.reason_code,
    reason: row.reason,
    requestHash: row.request_hash,
    idempotencyKey: row.idempotency_key,
    metadataJson: row.metadata_json,
    createdAt: row.created_at
  };
}

export function staffActionReceiptFromEvent(event: StaffActionAuditEvent): StaffActionReceiptDto {
  return {
    id: event.id,
    assessmentId: event.assessmentId,
    target: {
      type: event.targetType,
      id: event.targetId
    },
    action: event.action,
    actorId: event.actorId,
    previousState: event.fromState,
    resultingState: event.toState,
    reasonCode: event.reasonCode,
    reason: event.reason,
    auditReference: event.id,
    createdAt: event.createdAt
  };
}

/** Query all audit events for a given assessment, ordered newest first. */
export async function findAuditEventsByAssessment(
  db: AsyncDb,
  assessmentId: string
): Promise<StaffActionAuditEvent[]> {
  const rows = await db.queryAll<StaffActionAuditEventRow>(
    `SELECT * FROM staff_action_audit_events
     WHERE assessment_id = ?
     ORDER BY created_at DESC
     LIMIT 200`,
    assessmentId
  );
  return rows.map(mapStaffActionAuditEventRow);
}
