import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const payload = await request.json().catch(() => null);

  if (!payload?.transcript || !payload?.sessionId) {
    return json({ message: 'Missing transcript or Stripe session id.' }, { status: 400 });
  }

  const record = {
    receivedAt: new Date().toISOString(),
    sessionId: payload.sessionId,
    source: payload.source || 'website-chatbot',
    transcript: payload.transcript
  };

  console.info('Assessment transcript received', JSON.stringify(record));

  return json({ ok: true });
};
