import { json } from '@sveltejs/kit';
import { getCheckoutSession } from '$lib/server/stripe';
import { getTranscript, deleteTranscript } from '$lib/server/assessment/transcript-store';
import { getPipelineStatus, setPipelineStatus } from '$lib/server/assessment/pipeline-store';
import { enqueueReportJob } from '$lib/server/assessment/queue';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
  interface Payload {
    sessionId?: string;
    transcript?: string;
    source?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    company?: string;
  }
  const payload = (await request.json().catch(() => null)) as Payload | null;

  if (!payload?.sessionId) {
    return json({ message: 'Missing Stripe session id.' }, { status: 400 });
  }

  // Step 1: Verify payment via Stripe
  const stripeSession = await getCheckoutSession(payload.sessionId);
  if (!stripeSession) {
    return json({ message: 'Could not retrieve Stripe session.' }, { status: 502 });
  }

  if (stripeSession.payment_status !== 'paid' && stripeSession.status !== 'complete') {
    return json({ message: 'Payment not yet completed.' }, { status: 400 });
  }

  // Step 2: Collect transcript (client-side or from Retell server store)
  const hasTranscript = Boolean(payload.transcript?.trim?.());
  const retellCallId = stripeSession.metadata?.retell_call_id;

  let transcript: string = payload.transcript || '';
  const source = payload.source || stripeSession.metadata?.source;
  let customerName: string = payload.customerName || stripeSession.metadata?.customer_name || stripeSession.customer_details?.name || '';
  let customerEmail: string = payload.customerEmail || stripeSession.metadata?.customer_email || stripeSession.customer_details?.email || '';
  let customerPhone: string = payload.customerPhone || stripeSession.metadata?.customer_phone || '';
  let company: string = payload.company || stripeSession.metadata?.company || '';

  // For voice-agent flows: retrieve transcript stored by Retell webhook
  if (!hasTranscript && retellCallId) {
    const stored = await getTranscript(retellCallId);
    if (stored?.transcript) {
      transcript = stored.transcript;
      customerName = customerName || (stored.metadata.customer_name as string) || '';
      customerEmail = customerEmail || (stored.metadata.customer_email as string) || '';
      customerPhone = customerPhone || (stored.metadata.customer_phone as string) || '';
      company = company || (stored.metadata.company as string) || '';
      await deleteTranscript(retellCallId);
    }
  }

  if (!transcript) {
    await setPipelineStatus(payload.sessionId, { status: 'pending_transcript' });
    return json({
      message: 'Payment verified, but transcript not available yet. It will be processed when the interview completes.',
      status: 'pending_transcript',
      sessionId: payload.sessionId
    }, { status: 202 });
  }

  console.info('Payment verified and transcript received', JSON.stringify({
    sessionId: payload.sessionId,
    source,
    customerName,
    company,
    transcriptLength: transcript.length
  }));

  // Step 3: Enqueue the report pipeline (async — don't block client)
  await setPipelineStatus(payload.sessionId, { status: 'queued' });
  const queue = platform?.env?.assessment_queue;
  await enqueueReportJob(queue, {
    receivedAt: new Date().toISOString(),
    source,
    sessionId: payload.sessionId,
    customerName,
    customerEmail,
    customerPhone,
    company,
    transcript
  });

  // Return 202 Accepted immediately so the success page doesn't hang
  return json({
    ok: true,
    status: 'queued',
    sessionId: payload.sessionId,
    source
  });
};

export const GET: RequestHandler = async ({ url }) => {
  const sessionId = url.searchParams.get('sessionId');
  if (!sessionId) return json({ message: 'Missing sessionId' }, { status: 400 });

  const result = await getPipelineStatus(sessionId);
  if (!result) return json({ status: 'unknown' });

  return json({
    sessionId,
    status: result.status,
    deckUrl: result.deckUrl || undefined,
    reportId: result.reportId || undefined,
    error: result.error || undefined
  });
};
