import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { requireOperator } from '$lib/server/operator-auth';
import { D1HumanAssistStore } from '$lib/server/assessment/human-assist/store';

/**
 * GET /api/operator/human-assist
 *
 * Get the human assist queue — assessments flagged by gates for operator review.
 * Optional query param: status=pending|in_review|approved|rejected|edited
 */
export async function GET(event: RequestEvent) {
  try {
    const env = event.platform?.env as Record<string, unknown> | undefined;
    const db = env?.assessment_db as D1Database | undefined;

    // Require operator/admin role
    await requireOperator(event.locals, db);

    if (!db) {
      return json({ success: false, error: 'D1 binding not available' });
    }

    const status = event.url.searchParams.get('status') || undefined;
    const store = new D1HumanAssistStore(db);
    const [queue, stats] = await Promise.all([
      store.getQueue(status),
      store.getQueueStats()
    ]);

    return json({ success: true, queue, stats });
  } catch (err) {
    console.error('[human-assist:api] Failed to fetch queue:', err);
    return json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch queue' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/operator/human-assist
 *
 * Manually create a human assist review for an assessment.
 * Body: { assessmentId: string, gateRunId: string, gateType: string }
 */
export async function POST(event: RequestEvent) {
  try {
    const env = event.platform?.env as Record<string, unknown> | undefined;
    const db = env?.assessment_db as D1Database | undefined;

    // Require operator/admin role
    await requireOperator(event.locals, db);

    if (!db) return json({ success: false, error: 'D1 binding not available' });

    const body = (await event.request.json().catch(() => ({}))) as Record<string, unknown>;
    const assessmentId = body.assessmentId as string;
    const gateRunId = body.gateRunId as string;
    const gateType = body.gateType as string;

    if (!assessmentId || !gateRunId || !gateType) {
      return json({ success: false, error: 'assessmentId, gateRunId, and gateType are required' }, { status: 400 });
    }

    const store = new D1HumanAssistStore(db);
    const reviewId = await store.createReview(assessmentId, gateRunId, gateType);

    return json({ success: true, reviewId }, { status: 201 });
  } catch (err) {
    console.error('[human-assist:api] Failed to create review:', err);
    return json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to create review' },
      { status: 500 }
    );
  }
}
