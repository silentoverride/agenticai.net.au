import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { getDb } from '$lib/server/db';
import { requireStaff } from '$lib/server/staff-auth';
import {
  findMeetingBriefByAssessment,
  insertMeetingBrief,
  updateMeetingBrief
} from '$lib/server/staff-portal/repositories/meeting-brief.repository';
import { MEETING_BRIEF_STATUSES } from '$lib/server/staff-portal/domain/meeting-brief-states';
import { getCalendlyConfig } from '$lib/server/staff-portal/services/calendly.service';
import { validateMeetingBriefReady, isStatusTransitionAllowed } from '$lib/server/staff-portal/services/meeting-brief-readiness';
import { checkMeetingBriefStaleness } from '$lib/server/staff-portal/services/meeting-brief-staleness';
import { recordMeetingBriefStatusChange } from '$lib/server/staff-portal/services/meeting-brief-audit.service';

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
  linkedReportId: z.string().nullable().optional(),
  exceptionReason: z.string().nullable().optional(),
  idempotencyKey: z.string().optional()
}).strict();

// ── Routes ──

export async function GET(event: RequestEvent) {
  const assessmentId = event.params.assessmentId;
  if (!assessmentId) {
    return json({ success: false, error: { code: 'validationFailed', message: 'Assessment ID is required' } }, { status: 400 });
  }

  try {
    await requireStaff(event.locals, event.platform?.env?.assessment_db);
  } catch {
    return json({ success: false, error: { code: 'permissionDenied', message: 'Operator access required' } }, { status: 403 });
  }

  const db = getDb();
  const meetingBrief = await findMeetingBriefByAssessment(db, assessmentId);
  const calendly = await getCalendlyConfig(db);

  // Check staleness if meeting brief exists
  let staleWarning = null;
  if (meetingBrief) {
    staleWarning = checkMeetingBriefStaleness(meetingBrief);
  }

  return json({ meetingBrief, calendly, staleWarning });
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
    await requireStaff(event.locals, event.platform?.env?.assessment_db);
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

  // Determine previous status for audit (if status is changing)
  const previousStatus = existing?.status ?? null;
  const requestedStatus = parsed.data.status;

  // Ready-state guard: check linked report approval when transitioning to 'ready'
  if (requestedStatus === 'ready') {
    const effectiveReportId = parsed.data.linkedReportId ?? existing?.linkedReportId ?? null;
    const hasException = Boolean(parsed.data.exceptionReason);

    if (!hasException) {
      const readyCheck = await validateMeetingBriefReady({
        db,
        meetingBriefId: existing?.id ?? 'new',
        linkedReportId: effectiveReportId
      });

      if (!readyCheck.allowed) {
        return json({
          success: false,
          error: {
            code: 'blockedAction',
            message: readyCheck.message,
            remediationHint: 'Provide an exception reason if no approved report is needed.'
          }
        }, { status: 400 });
      }
    }
  }

  // State transition guard: check if the transition is allowed
  if (requestedStatus && existing && previousStatus) {
    const allowed = isStatusTransitionAllowed(previousStatus, requestedStatus);
    if (!allowed) {
      return json({
        success: false,
        error: {
          code: 'blockedAction',
          message: `Cannot transition from "${previousStatus}" to "${requestedStatus}".`,
          currentState: previousStatus,
          remediationHint: `Allowed states from "${previousStatus}": check Meeting Brief state transitions.`
        }
      }, { status: 400 });
    }
  }

  try {
    const idempotencyKey = parsed.data.idempotencyKey ?? crypto.randomUUID();

    if (existing) {
      // Update existing
      const updated = await updateMeetingBrief(db, {
        id: existing.id,
        ...parsed.data
      });

      // Create audit event if status changed
      if (requestedStatus && previousStatus && requestedStatus !== previousStatus) {
        await recordMeetingBriefStatusChange({
          db,
          assessmentId,
          meetingBriefId: existing.id,
          actorId,
          fromState: previousStatus,
          toState: requestedStatus,
          idempotencyKey,
          reasonCode: parsed.data.exceptionReason ? 'exception' : 'status_change',
          reason: parsed.data.exceptionReason ?? undefined
        });
      }

      return json({ success: true, meetingBrief: updated });
    } else {
      // Create new
      const id = crypto.randomUUID();
      const targetStatus = requestedStatus ?? MEETING_BRIEF_STATUSES.DRAFT;
      const created = await insertMeetingBrief(db, {
        id,
        assessmentId,
        status: targetStatus,
        ...parsed.data
      });

      // Create audit event for initial status
      await recordMeetingBriefStatusChange({
        db,
        assessmentId,
        meetingBriefId: id,
        actorId,
        fromState: 'draft',
        toState: targetStatus,
        idempotencyKey,
        reasonCode: 'created'
      });

      return json({ success: true, meetingBrief: created });
    }
  } catch (err) {
    console.error('Failed to save meeting brief:', err);
    return json({ success: false, error: { code: 'auditWriteFailed', message: 'Failed to save meeting brief' } }, { status: 500 });
  }
}
