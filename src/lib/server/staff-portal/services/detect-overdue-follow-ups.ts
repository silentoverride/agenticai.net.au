import type { AsyncDb } from '$lib/server/db';
import type { StaffAuditEventDto, StaffActivityEventDto } from '$lib/staff-portal/dto';

// ---------------------------------------------------------------------------
// Input / Output
// ---------------------------------------------------------------------------

export interface DetectOverdueFollowUpsInput {
  db: AsyncDb;
  assessmentId?: string;    // scope to one assessment; omit for global sweep
}

export interface OverdueDetectionResult {
  newlyMarkedOverdue: string[];   // follow-up IDs that transitioned this call
  alreadyKnownOverdue: string[];  // follow-up IDs already marked before this call
  errors: Array<{ followUpId: string; message: string }>;
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/**
 * Detect open follow-ups past their due date and create a first-overdue /
 * missed Audit Event for client-visible promises, or an Activity entry for
 * non-client-visible ones.
 *
 * Idempotent: skips follow-ups that already have a 'first_overdue' audit
 * event recorded.
 */
export async function detectOverdueFollowUps(
  input: DetectOverdueFollowUpsInput
): Promise<OverdueDetectionResult> {
  const { db, assessmentId } = input;

  const newlyMarkedOverdue: string[] = [];
  const alreadyKnownOverdue: string[] = [];
  const errors: OverdueDetectionResult['errors'] = [];

  // 1. Find open follow-ups past due date
  let overdueSql = `
    SELECT id, assessment_id, title, owner_id, due_date,
           client_visible_promise, consequence_of_inaction
    FROM follow_ups
    WHERE status = 'open'
      AND due_date IS NOT NULL
      AND due_date < datetime('now')
  `;
  const params: unknown[] = [];

  if (assessmentId) {
    overdueSql += ' AND assessment_id = ?';
    params.push(assessmentId);
  }

  const overdueRows = await db.queryAll<{
    id: string;
    assessment_id: string;
    title: string;
    owner_id: string | null;
    due_date: string;
    client_visible_promise: number;
    consequence_of_inaction: string | null;
  }>(overdueSql, ...params);

  if (overdueRows.length === 0) {
    return { newlyMarkedOverdue: [], alreadyKnownOverdue: [], errors: [] };
  }

  // 2. Check which ones already have an audit event recorded
  const ids = overdueRows.map((r) => r.id);
  const placeholders = ids.map(() => '?').join(',');
  const auditRows = await db.queryAll<{
    follow_up_id: string;
    has_event: number;
  }>(
    `SELECT
       ae.target_id AS follow_up_id,
       1 AS has_event
     FROM staff_action_audit_events ae
     WHERE ae.action = 'first_overdue'
       AND ae.target_id IN (${placeholders})`,
    ...ids
  );

  const hasEvent = new Set(auditRows.map((r) => r.follow_up_id));

  // 3. Process each overdue follow-up
  for (const row of overdueRows) {
    if (hasEvent.has(row.id)) {
      alreadyKnownOverdue.push(row.id);
      continue;
    }

    try {
      // Create the audit event for client-visible promises
      if (row.client_visible_promise) {
        await db.exec(
          `INSERT INTO staff_action_audit_events (
            id, assessment_id, target_type, target_id, actor_id,
            action, from_state, to_state, reason_code, reason,
            request_hash, idempotency_key, metadata_json, created_at
          ) VALUES (
            ?, ?, 'followUp', ?, 'system',
            'first_overdue', 'open', 'overdue', 'auto_detected', ?,
            ?, ?, '{}', datetime('now')
          )`,
          crypto.randomUUID(),
          row.assessment_id,
          row.id,
          row.consequence_of_inaction
            ? `Follow-up overdue: ${row.title}. ${row.consequence_of_inaction}`
            : `Follow-up overdue: ${row.title}`,
          crypto.randomUUID(),
          crypto.randomUUID()
        );
      } else {
        // Non-client-visible: just record activity visibility
        await db.exec(
          `INSERT INTO staff_activity_events (
            id, assessment_id, summary, source_domain, actor, created_at
          ) VALUES (
            ?, ?, ?, 'follow_up', 'system', datetime('now')
          )`,
          crypto.randomUUID(),
          row.assessment_id,
          row.consequence_of_inaction
            ? `Follow-up overdue: ${row.title}. ${row.consequence_of_inaction}`
            : `Follow-up overdue: ${row.title}`
        );
      }

      newlyMarkedOverdue.push(row.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push({ followUpId: row.id, message });
    }
  }

  return { newlyMarkedOverdue, alreadyKnownOverdue, errors };
}
