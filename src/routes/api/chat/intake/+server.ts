/**
 * GET /api/chat/intake?sessionId=<id>
 *
 * Retrieves saved Annie chat intake progress for session resume.
 * Returns 404 if session not found or expired (>24h).
 */

import { json } from '@sveltejs/kit';
import { apiError } from '$lib/server/api-error';
import type { RequestHandler } from './$types';

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const GET: RequestHandler = async ({ url, platform }) => {
  const sessionId = url.searchParams.get('sessionId');
  if (!sessionId) {
    throw apiError(400, 'Missing sessionId parameter');
  }

  if (!platform?.env?.assessment_db) {
    return json({ found: false, reason: 'no_db' });
  }

  const db = platform.env.assessment_db;

  try {
    const record = await db
      .prepare('SELECT * FROM intake_progress WHERE session_id = ? AND completed = 0')
      .bind(sessionId)
      .first<{
        id: number;
        session_id: string;
        answers_json: string;
        current_index: number;
        created_at: string;
        updated_at: string;
      }>();

    if (!record) {
      return json({ found: false, reason: 'not_found' });
    }

    // Check session expiry
    const updatedAt = new Date(record.updated_at).getTime();
    const now = Date.now();
    if (now - updatedAt > SESSION_TTL_MS) {
      // Mark session as expired so we don't keep checking it
      await db
        .prepare('UPDATE intake_progress SET completed = 2 WHERE id = ?')
        .bind(record.id)
        .run();

      return json({
        found: false,
        reason: 'expired',
        message: 'Your previous session has expired. Please start a new assessment.',
        expiredAt: new Date(updatedAt + SESSION_TTL_MS).toISOString()
      });
    }

    const answers = JSON.parse(record.answers_json);

    return json({
      found: true,
      session: {
        sessionId: record.session_id,
        answers,
        currentIndex: record.current_index,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        expiresIn: Math.round((SESSION_TTL_MS - (now - updatedAt)) / 1000) // seconds remaining
      }
    });
  } catch (err) {
    console.error('[chat/intake] GET error:', err);
    return json({ found: false, reason: 'db_error' });
  }
};
