import type { AsyncDb } from '$lib/server/db';
import type { MeetingBriefState, StaffActionReceiptDto } from '$lib/staff-portal/dto';
import {
  insertStaffActionAuditEvent,
  findStaffActionAuditEventByIdempotency,
  staffActionReceiptFromEvent
} from '../repositories/staff-audit.repository';

export interface CreateMeetingBriefAuditEventInput {
  db: AsyncDb;
  assessmentId: string;
  meetingBriefId: string;
  actorId: string;
  fromState: MeetingBriefState;
  toState: MeetingBriefState;
  idempotencyKey: string;
  previousStatus?: MeetingBriefState;
  reasonCode?: string;
  reason?: string;
}

/**
 * Creates an audit event for a Meeting Brief state change.
 * Returns a receipt if the event was created or an existing one
 * if the idempotency key was already used.
 */
export async function recordMeetingBriefStatusChange(
  input: CreateMeetingBriefAuditEventInput
): Promise<{ receipt?: StaffActionReceiptDto; error?: string }> {
  const { db, assessmentId, meetingBriefId, actorId, fromState, toState, idempotencyKey, reasonCode, reason } = input;

  // Check idempotency
  const existingEvent = await findStaffActionAuditEventByIdempotency(db, {
    actorId,
    assessmentId,
    idempotencyKey
  });
  if (existingEvent) {
    return { receipt: staffActionReceiptFromEvent(existingEvent) };
  }

  try {
    const event = await insertStaffActionAuditEvent(db, {
      id: crypto.randomUUID(),
      assessmentId,
      targetType: 'meetingBrief',
      targetId: meetingBriefId,
      actorId,
      action: 'changeMeetingBriefStatus',
      fromState,
      toState,
      reasonCode: reasonCode ?? (reason ? 'status_change' : null),
      reason: reason ?? null,
      requestHash: `${meetingBriefId}-to-${toState}-${new Date().toISOString()}`,
      idempotencyKey,
      createdAt: new Date().toISOString()
    });

    return { receipt: staffActionReceiptFromEvent(event) };
  } catch (err) {
    console.error('Failed to create meeting brief audit event:', err);
    return { error: 'Failed to record audit event for Meeting Brief state change.' };
  }
}
