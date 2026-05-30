import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { D1HumanAssistStore } from '$lib/server/assessment/human-assist/store';

/**
 * GET /api/staff/human-assist/[id]
 *
 * Get detailed information for a specific human assist review.
 */
export async function GET(event: RequestEvent) {
  try {
    const env = event.platform?.env as Record<string, unknown> | undefined;
    const db = env?.assessment_db as D1Database | undefined;

    if (!db) return json({ success: false, error: 'D1 binding not available' });

    const reviewId = event.params.id;
    if (!reviewId) return json({ success: false, error: 'Review ID required' }, { status: 400 });

    const store = new D1HumanAssistStore(db);
    const details = await store.getReviewDetails(reviewId);

    if (!details) {
      return json({ success: false, error: 'Review not found' }, { status: 404 });
    }

    return json({ success: true, review: details });
  } catch (err) {
    console.error('[human-assist:api] Failed to fetch review:', err);
    return json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch review' },
      { status: 500 }
    );
  }
}
