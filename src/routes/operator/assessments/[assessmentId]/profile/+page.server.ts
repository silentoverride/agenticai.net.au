import { error } from '@sveltejs/kit';
import { requireOperator } from '$lib/server/operator-auth';
import { getDb } from '$lib/server/db';
import { getClientProfileSnapshot } from '$lib/server/staff-portal/read-models/get-client-profile-snapshot';
import { deriveWhatMattersNow } from '$lib/server/staff-portal/read-models/derive-what-matters-now';
import { findFollowUpsByAssessment } from '$lib/server/staff-portal/repositories/follow-up.repository';
import { findMeetingBriefByAssessment } from '$lib/server/staff-portal/repositories/meeting-brief.repository';
import { findCommercialNextStepByAssessment } from '$lib/server/staff-portal/repositories/commercial-next-step.repository';
import { getCalendlyConfig } from '$lib/server/staff-portal/services/calendly.service';
import { checkMeetingBriefStaleness } from '$lib/server/staff-portal/services/meeting-brief-staleness';
import { getLinkedReportContext } from '$lib/server/staff-portal/read-models/get-linked-report-context';
import { getLinkedGateFindings } from '$lib/server/staff-portal/read-models/get-linked-gate-findings';
import { getClientAuditHistory } from '$lib/server/staff-portal/read-models/get-client-audit-history';
import { getClientActivityHistory } from '$lib/server/staff-portal/read-models/get-client-activity-history';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform, params }) => {
  const role = await requireOperator(locals, platform?.env.assessment_db) as 'operator' | 'admin';

  const auth = locals.auth();
  const userId = auth.userId;
  if (!userId) {
    throw error(401, 'Not authenticated');
  }

  const db = getDb();
  const assessmentId = params.assessmentId;

  try {
    // 1. Client Profile Snapshot (Story 3.1)
    const profileResult = await getClientProfileSnapshot({
      db,
      clientId: assessmentId,
      actorId: userId,
      role
    });

    // Non-leaking permission denied
    if (profileResult.errorCode === 'permission_denied') {
      throw error(403, 'You do not have access to this assessment.');
    }

    // 7. Follow-ups (Story 4.2) — fetch before What Matters Now to pass urgency
    const followUps = profileResult.hasData
      ? await findFollowUpsByAssessment(db, assessmentId)
      : [];

    // Pick the most urgent open follow-up (overdue first, then nearest due date)
    const openFollowUps = followUps.filter((fu) => fu.status === 'open');
    openFollowUps.sort((a, b) => {
      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      // Overdue items (past due) rank higher than future due
      const now = Date.now();
      const aIsOverdue = aDue < now;
      const bIsOverdue = bDue < now;
      if (aIsOverdue && !bIsOverdue) return -1;
      if (!aIsOverdue && bIsOverdue) return 1;
      return aDue - bDue;
    });
    const mostUrgentFollowUp = openFollowUps[0] ?? null;

    // 2. What Matters Now (Story 3.2) — pass most urgent follow-up
    const whatMattersNow = profileResult.hasData && profileResult.profile
      ? deriveWhatMattersNow({ profile: profileResult.profile, mostUrgentFollowUp })
      : null;

    // 3. Linked Reports Context (Story 3.3)
    const linkedReports = profileResult.hasData
      ? await getLinkedReportContext({ db, assessmentId })
      : [];

    // 4. Linked Gate Findings (Story 3.3)
    const linkedFindings = profileResult.hasData
      ? await getLinkedGateFindings({ db, assessmentId })
      : [];

    // 5. Audit History (Story 3.4)
    const auditHistory = profileResult.hasData
      ? await getClientAuditHistory({ db, assessmentId, actorId: userId, role })
      : [];

    // 6. Activity History (Story 3.4)
    const activityHistory = profileResult.hasData
      ? await getClientActivityHistory({ db, assessmentId })
      : [];

    // 7. Follow-ups (Story 4.2)
    // (fetched above on line 38 for What Matters Now input)

    // 8. Meeting Brief (Story 5.1)
    const meetingBrief = profileResult.hasData
      ? await findMeetingBriefByAssessment(db, assessmentId)
      : null;
    const calendly = profileResult.hasData
      ? await getCalendlyConfig(db)
      : { calendlyLink: null };
    const staleWarning = meetingBrief
      ? checkMeetingBriefStaleness(meetingBrief)
      : null;

    // 9. Commercial Next Step (Story 5.4)
    const commercialStep = profileResult.hasData
      ? await findCommercialNextStepByAssessment(db, assessmentId)
      : null;

    return {
      profile: profileResult,
      whatMattersNow,
      linkedReports,
      linkedFindings,
      auditHistory,
      activityHistory,
      followUps,
      meetingBrief,
      staleWarning,
      calendly,
      assessmentId,
      commercialStep
    };
  } catch (err) {
    const errStatus = (err as Error & { status?: number }).status ?? 500;
    if (errStatus === 403) {
      throw error(403, 'You do not have access to this assessment.');
    }
    throw error(500, 'Could not load client profile data.');
  }
};
