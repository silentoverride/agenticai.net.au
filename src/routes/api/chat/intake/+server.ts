/**
 * POST /api/chat/intake
 *
 * Persists Annie chat intake answers to D1.
 * Creates/updates the intake_progress record for the session.
 *
 * Body:
 *   { sessionId, questionId, answer, isFollowUp, currentIndex }
 */

import { json } from '@sveltejs/kit';
import { apiError } from '$lib/server/api-error';
import type { RequestHandler } from './$types';

interface IntakePayload {
  sessionId: string;
  questionId: string;
  answer: string;
  isFollowUp?: boolean;
  currentIndex: number;
}

export const POST: RequestHandler = async ({ request, platform }) => {
  const payload = await request.json<IntakePayload>().catch(() => null);

  if (!payload || !payload.sessionId || !payload.questionId || !payload.answer) {
    throw apiError(400, 'Missing required fields: sessionId, questionId, answer');
  }

  if (!platform?.env?.assessment_db) {
    // Graceful degradation: log but don't fail
    console.warn('[chat/intake] No D1 binding available, skipping persistence');
    return json({ persisted: false, reason: 'no_db' });
  }

  const db = platform.env.assessment_db;

  try {
    // Check if a progress record exists for this session
    const existing = await db
      .prepare('SELECT id, answers_json FROM intake_progress WHERE session_id = ?')
      .bind(payload.sessionId)
      .first<{ id: number; answers_json: string }>();

    const now = new Date().toISOString();
    const answerEntry = {
      questionId: payload.questionId,
      answer: payload.answer,
      isFollowUp: payload.isFollowUp || false,
      timestamp: now
    };

    if (existing) {
      // Update existing record
      const currentAnswers = JSON.parse(existing.answers_json || '[]');
      currentAnswers.push(answerEntry);

      await db
        .prepare(`
          UPDATE intake_progress
          SET answers_json = ?, current_index = ?, updated_at = ?
          WHERE id = ?
        `)
        .bind(
          JSON.stringify(currentAnswers),
          payload.currentIndex,
          now,
          existing.id
        )
        .run();
    } else {
      // Create new progress record
      await db
        .prepare(`
          INSERT INTO intake_progress (session_id, answers_json, current_index, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `)
        .bind(
          payload.sessionId,
          JSON.stringify([answerEntry]),
          payload.currentIndex,
          now,
          now
        )
        .run();
    }

    return json({ persisted: true });
  } catch (err) {
    console.error('[chat/intake] DB error:', err);
    return json({ persisted: false, reason: 'db_error' });
  }
};
