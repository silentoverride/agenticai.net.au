import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { requireStaff } from '$lib/server/staff-auth';
import { getDb } from '$lib/server/db';
import { listAllReports } from '$lib/server/staff-portal/read-models/list-all-reports';
import type { StaffRole } from '$lib/staff-portal/dto';

/**
 * GET /api/staff/reports
 *
 * Returns a unified, searchable, filterable list of all reports the
 * authenticated staff member has permission to view.
 *
 * Query params:
 *   ?search=term          — keyword search across title, customer, email, company
 *   ?status=completed     — filter by raw pipeline status
 *   ?dateFrom=YYYY-MM-DD  — filter reports created on or after this date
 *   ?dateTo=YYYY-MM-DD    — filter reports created on or before this date
 *   ?sort=updated         — sort column: title, customer, status, updated, created
 *   ?order=desc           — sort direction: asc or desc
 *   ?limit=50             — page size (max 200, default 50)
 *   ?offset=0             — pagination offset
 */

export async function GET(event: RequestEvent) {
  try {
    const role = await requireStaff(event.locals) as StaffRole;

    const auth = event.locals.auth();
    const actorId = auth.userId;
    if (!actorId) {
      return json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const db = getDb();

    const url = new URL(event.request.url);
    const search = url.searchParams.get('search') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const dateFrom = url.searchParams.get('dateFrom') || undefined;
    const dateTo = url.searchParams.get('dateTo') || undefined;
    const sort = (url.searchParams.get('sort') || 'updated') as 'title' | 'customer' | 'status' | 'updated' | 'created';
    const order = (url.searchParams.get('order') || 'desc') as 'asc' | 'desc';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 200);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10) || 0, 0);

    const result = await listAllReports({
      db,
      actorId,
      role,
      search,
      status,
      dateFrom,
      dateTo,
      sort,
      order,
      limit,
      offset
    });

    return json({
      success: true,
      ...result,
      fetchedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('[reports:api] Failed to fetch reports:', err);
    const status = err instanceof Error && err.message.includes('not authenticated') ? 401 : 500;
    return json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Reports query failed'
      },
      { status }
    );
  }
}
