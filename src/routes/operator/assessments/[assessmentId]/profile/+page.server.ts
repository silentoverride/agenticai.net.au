import { error } from '@sveltejs/kit';
import { requireOperator } from '$lib/server/operator-auth';
import { getDb } from '$lib/server/db';
import { getClientProfileSnapshot } from '$lib/server/staff-portal/read-models/get-client-profile-snapshot';
import { deriveWhatMattersNow } from '$lib/server/staff-portal/read-models/derive-what-matters-now';
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

    // 2. What Matters Now (Story 3.2)
    const whatMattersNow = profileResult.hasData && profileResult.profile
      ? deriveWhatMattersNow({ profile: profileResult.profile })
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

    return {
      profile: profileResult,
      whatMattersNow,
      linkedReports,
      linkedFindings,
      auditHistory,
      activityHistory
    };
  } catch (err) {
    const errStatus = (err as Error & { status?: number }).status ?? 500;
    if (errStatus === 403) {
      throw error(403, 'You do not have access to this assessment.');
    }
    throw error(500, 'Could not load client profile data.');
  }
};
