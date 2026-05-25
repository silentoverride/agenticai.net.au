import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { getDb } from '$lib/server/db';
import { requireOperator } from '$lib/server/operator-auth';
import {
  findMeetingBriefByAssessment,
  insertMeetingBrief,
  updateMeetingBrief
} from '$lib/server/staff-portal/repositories/meeting-brief.repository';
import { MEETING_BRIEF_STATUSES } from '$lib/server/staff-portal/domain/meeting-brief-states';
import { getCalendlyConfig } from '$lib/server/staff-portal/services/calendly.service';

// ── Schemas ──

const upsertMeetingBriefSchema = z.object({
  meetingDate: z.string().nullable().optional(),
  objective: z.string().nullable().optional(),
  talkingPoints: z.string().nullable().optional(),
  sensitiveIssues: z.string().nullable().optional(),
  offerNextStep: z.string().nullable().optional(),
  followUpIntention: z.string().nullable().optional(),
  finalAgendaNotes: z.string().nullable().optional(),
  prepChecklist: z.string().nullable().optional(),
  status: z.enum(['draft', 'needsReview', 'ready', 'stale', 'completed']).optional(),
  linkedReportId: z.string().nullable().optional()
}).strict();

// ── Routes ──

export async function GET(event: RequestEvent) {
  const assessmentId = event.params.assessmentId;
  if (!assessmentId) {
    return json({ success: false, error: { code: 'validationFailed', message: 'Assessment ID is required' } }, { status: 400 });
  }

  try {
    await requireOperator(event.locals, event.platform?.env?.assessment_db);
  } catch {
    return json({ success: false, error: { code: 'permissionDenied', message: 'Operator access required' } }, { status: 403 });
  }

  const db = getDb();
  const meetingBrief = await findMeetingBriefByAssessment(db, assessmentId);
  const calendly = await getCalendlyConfig(db);

  return json({ meetingBrief, calendly });
}

export async function PUT(event: RequestEvent) {
  const auth = event.locals.auth();
  const actorId = auth.userId;
  if (!actorId) {
    return json({ success: false, error: { code: 'permissionDenied', message: 'Not authenticated' } }, { status: 401 });
  }

  const assessmentId = event.params.assessmentId;
  if (!assessmentId) {
    return json({ success: false, error: { code: 'validationFailed', message: 'Assessment ID is required' } }, { status: 400 });
  }

  try {
    await requireOperator(event.locals, event.platform?.env?.assessment_db);
  } catch {
    return json({ success: false, error: { code: 'permissionDenied', message: 'Operator access required' } }, { status: 403 });
  }

  let rawBody: unknown;
  try {
    rawBody = await event.request.json();
  } catch {
    return json({ success: false, error: { code: 'validationFailed', message: 'Request body must be valid JSON' } }, { status: 400 });
  }

  const parsed = upsertMeetingBriefSchema.safeParse(rawBody);
  if (!parsed.success) {
    return json({
      success: false,
      error: { code: 'validationFailed', message: parsed.error.issues.map(i => i.message).join('; ') }
    }, { status: 400 });
  }

  const db = getDb();

  // Check if a meeting brief already exists
  const existing = await findMeetingBriefByAssessment(db, assessmentId);

  try {
    if (existing) {
      // Update existing
      const updated = await updateMeetingBrief(db, {
        id: existing.id,
        ...parsed.data
      });
      return json({ success: true, meetingBrief: updated });
    } else {
      // Create new
      const id = crypto.randomUUID();
      const created = await insertMeetingBrief(db, {
        id,
        assessmentId,
        status: parsed.data.status ?? MEETING_BRIEF_STATUSES.DRAFT,
        ...parsed.data
      });
      return json({ success: true, meetingBrief: created });
    }
  } catch (err) {
    console.error('Failed to save meeting brief:', err);
    return json({ success: false, error: { code: 'auditWriteFailed', message: 'Failed to save meeting brief' } }, { status: 500 });
  }
}
