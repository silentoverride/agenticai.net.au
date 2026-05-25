import type { AsyncDb } from '$lib/server/db';
import type {
  StaffAuditEventDto,
  AuditEventType,
  AffectedEntityType
} from '$lib/staff-portal/dto';

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface GetClientAuditHistoryInput {
  db: AsyncDb;
  assessmentId: string;
  actorId: string;
  role: 'admin' | 'operator';
  limit?: number;
}

// ---------------------------------------------------------------------------
// Row from staff_action_audit_events
// ---------------------------------------------------------------------------

interface AuditEventRow {
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

// ---------------------------------------------------------------------------
// Read model
// ---------------------------------------------------------------------------

export async function getClientAuditHistory(
  input: GetClientAuditHistoryInput
): Promise<StaffAuditEventDto[]> {
  const { db, assessmentId, actorId, role, limit = 50 } = input;

  // Admin sees all audit events for the client.
  // Operator sees only events for their assigned work.
  const rows = role === 'admin'
    ? await db.queryAll<AuditEventRow>(
        `SELECT * FROM staff_action_audit_events
         WHERE assessment_id = ?
         ORDER BY created_at DESC
         LIMIT ?`,
        assessmentId,
        limit
      )
    : await db.queryAll<AuditEventRow>(
        `SELECT e.* FROM staff_action_audit_events e
         WHERE e.assessment_id = ?
           AND (e.actor_id = ?)
         ORDER BY e.created_at DESC
         LIMIT ?`,
        assessmentId,
        actorId,
        limit
      );

  return rows.map(toAuditEventDto);
}

// ---------------------------------------------------------------------------
// Admin audit trail
// ---------------------------------------------------------------------------

export interface GetAuditTrailInput {
  db: AsyncDb;
  actorId: string;
  role: 'admin' | 'operator';
  limit?: number;
  offset?: number;
}

export interface AuditTrailResult {
  events: StaffAuditEventDto[];
  total: number;
  hasMore: boolean;
}

export async function getAuditTrail(
  input: GetAuditTrailInput
): Promise<AuditTrailResult> {
  const { db, role, limit = 100, offset = 0 } = input;

  // Admin-only: broader audit trail across clients and staff actions
  if (role !== 'admin') {
    return { events: [], total: 0, hasMore: false };
  }

  // Get total count
  const countRow = await db.queryOne<{ total: number }>(
    'SELECT COUNT(*) AS total FROM staff_action_audit_events'
  );
  const total = countRow?.total ?? 0;

  // Get bounded page
  const rows = await db.queryAll<AuditEventRow>(
    `SELECT * FROM staff_action_audit_events
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    limit,
    offset
  );

  return {
    events: rows.map(toAuditEventDto),
    total,
    hasMore: offset + rows.length < total
  };
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

/**
 * Map an action/event type from the persisted action ID to an AuditEventType.
 * Falls back to a generic label if the action doesn't match known types.
 */
function mapAuditEventType(action: string): AuditEventType {
  switch (action) {
    case 'approveReport':
    case 'rejectReport':
    case 'requestRegeneration':
    case 'requestClarification':
      return 'report_state_change';
    case 'resolveFinding':
    case 'overrideFinding':
    case 'escalateFinding':
    case 'claimFinding':
      return 'gate_finding_decision';
    case 'completeFollowUp':
    case 'deferFollowUp':
    case 'reassignFollowUp':
      return 'follow_up_change';
    case 'markMeetingReady':
    case 'markMeetingStale':
      return 'meeting_brief_change';
    case 'updateCommercialStatus':
      return 'commercial_change';
    case 'assignOwner':
    case 'transferOwnership':
      return 'ownership_change';
    default:
      // If the action contains a known entity type, derive from it
      if (action.includes('FollowUp') || action.includes('follow_up')) return 'follow_up_change';
      if (action.includes('Meeting') || action.includes('meeting')) return 'meeting_brief_change';
      if (action.includes('Commercial') || action.includes('commercial')) return 'commercial_change';
      return 'report_state_change';
  }
}

/**
 * Map the persisted target_type to an AffectedEntityType.
 */
function mapAffectedEntityType(targetType: string): AffectedEntityType {
  switch (targetType) {
    case 'report': return 'report';
    case 'gateFinding':
    case 'gate_finding': return 'gate_finding';
    case 'followUp':
    case 'follow_up': return 'follow_up';
    case 'meetingBrief':
    case 'meeting_brief': return 'meeting_brief';
    case 'commercialNextStep':
    case 'commercial_next_step': return 'commercial_next_step';
    default: return 'report';
  }
}

function toAuditEventDto(row: AuditEventRow): StaffAuditEventDto {
  const receiptRoute = `/operator/assessments/${row.assessment_id}/review#receipt-${row.id}`;
  const sourceContextRoute = `/operator/assessments/${row.assessment_id}`;

  return {
    eventId: row.id,
    actor: row.actor_id,
    timestamp: row.created_at,
    eventType: mapAuditEventType(row.action),
    affectedEntity: row.target_id ?? row.assessment_id,
    affectedEntityType: mapAffectedEntityType(row.target_type),
    previousState: row.from_state === '' ? null : row.from_state,
    newState: row.to_state,
    reasonOrNote: row.reason ?? row.reason_code ?? null,
    receiptRoute,
    sourceContextRoute
  };
}
