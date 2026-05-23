import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { D1HumanAssistStore, type ReviewAction } from '$lib/server/assessment/human-assist/store';

/**
 * POST /api/operator/human-assist/[id]/review
 *
 * Perform a review action: approve, reject, or edit.
 *
 * Body: { action: 'approve' | 'reject' | 'edit', notes?: string, editedContent?: string, operatorId?: string }
 */
export async function POST(event: RequestEvent) {
  try {
    const env = event.platform?.env as Record<string, unknown> | undefined;
    const db = env?.assessment_db as D1Database | undefined;
    if (!db) return json({ success: false, error: 'D1 binding not available' });

    const reviewId = event.params.id;
    if (!reviewId) return json({ success: false, error: 'Review ID required' }, { status: 400 });

    const body = (await event.request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = body.action as string;

    if (!action || !['approve', 'reject', 'edit'].includes(action)) {
      return json({ success: false, error: 'action must be approve, reject, or edit' }, { status: 400 });
    }

    if (action === 'edit' && !body.editedContent) {
      return json({ success: false, error: 'editedContent required for edit action' }, { status: 400 });
    }

    const reviewAction: ReviewAction = {
      action: action as 'approve' | 'reject' | 'edit',
      notes: body.notes as string | undefined,
      editedContent: body.editedContent as string | undefined,
      operatorId: body.operatorId as string | undefined
    };

    const store = new D1HumanAssistStore(db);

    // Claim the review first (only if pending)
    if (reviewAction.operatorId) {
      await store.claimReview(reviewId, reviewAction.operatorId).catch(() => {
        // Already claimed by someone else — that's fine
      });
    }

    await store.performReview(reviewId, reviewAction);

    return json({ success: true });
  } catch (err) {
    console.error('[human-assist:api] Review action failed:', err);
    return json(
      { success: false, error: err instanceof Error ? err.message : 'Review action failed' },
      { status: 500 }
    );
  }
}
