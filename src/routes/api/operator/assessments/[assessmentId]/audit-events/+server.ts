import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { getDb, setD1Binding } from '$lib/server/db';
import { requireOperator } from '$lib/server/operator-auth';
import { findAuditEventsByAssessment } from '$lib/server/staff-portal/repositories/staff-audit.repository';
import type { StaffActionReceiptDto } from '$lib/staff-portal/dto';

export async function GET(event: RequestEvent) {
  const actorId = event.locals.auth().userId;
  if (!actorId) return json({ error: 'Not authenticated' }, { status: 401 });
  const assessmentId = event.params.assessmentId;
  if (!assessmentId) return json({ error: 'Assessment ID is required' }, { status: 400 });

  try {
    const d1 = event.platform?.env?.assessment_db;
    if (d1) setD1Binding(d1);
    await requireOperator(event.locals, d1);
  } catch {
    return json({ error: 'Operator access required' }, { status: 403 });
  }

  const events = await findAuditEventsByAssessment(getDb(), assessmentId);
  return json({ events });
}

/** DTO for a single audit event entry returned by the timeline endpoint. */
export interface StaffAuditEventDto {
  id: string;
  assessmentId: string;
  targetType: string;
  targetId: string | null;
  actorId: string;
  action: string;
  previousState: string;
  resultingState: string;
  reasonCode: string | null;
  reason: string | null;
  createdAt: string;
}
