import type { AsyncDb } from '$lib/server/db';
import type { StaffActionReceiptDto } from '$lib/staff-portal/dto';
import { insertFollowUp } from '../repositories/follow-up.repository';
import {
  insertStaffActionAuditEvent,
  staffActionReceiptFromEvent
} from '../repositories/staff-audit.repository';

export interface CreateFollowUpFromMeetingBriefInput {
  db: AsyncDb;
  assessmentId: string;
  meetingBriefId: string;
  actorId: string;
  description: string;
  dueDate?: string | null;
  notesSnippet?: string;
}

export interface CreateFollowUpFromMeetingBriefResult {
  success: boolean;
  receipt?: StaffActionReceiptDto;
  error?: string;
}

/**
 * Creates a follow-up linked to a Meeting Brief source context
 * and records an Audit Event for the creation.
 */
export async function createFollowUpFromMeetingBrief(
  input: CreateFollowUpFromMeetingBriefInput
): Promise<CreateFollowUpFromMeetingBriefResult> {
  const { db, assessmentId, meetingBriefId, actorId, description, dueDate, notesSnippet } = input;

  try {
    // Create the follow-up
    const followUp = await insertFollowUp(db, {
      id: crypto.randomUUID(),
      assessmentId,
      title: description.slice(0, 100) || 'Follow-up from meeting',
      description,
      ownerId: null,
      dueDate: dueDate ?? null,
      source: 'meeting_brief',
      linkedMeetingBriefId: meetingBriefId
    });

    // Record audit event
    const event = await insertStaffActionAuditEvent(db, {
      id: crypto.randomUUID(),
      assessmentId,
      targetType: 'followUp',
      targetId: followUp.id,
      actorId,
      action: 'completeFollowUp',
      fromState: 'open',
      toState: 'open',
      reasonCode: 'from_meeting_brief',
      reason: `Follow-up created from Meeting Brief: ${(notesSnippet ?? description).slice(0, 200)}`,
      requestHash: `mb-followup-${meetingBriefId}-${crypto.randomUUID()}`,
      idempotencyKey: `mb-followup-${meetingBriefId}-${actorId}-${description.slice(0, 50)}`,
      createdAt: new Date().toISOString()
    });

    return { success: true, receipt: staffActionReceiptFromEvent(event) };
  } catch (err) {
    console.error('Failed to create follow-up from meeting brief:', err);
    return { success: false, error: 'Failed to create follow-up from meeting notes.' };
  }
}
