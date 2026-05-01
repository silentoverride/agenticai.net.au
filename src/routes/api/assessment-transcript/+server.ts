import { json } from '@sveltejs/kit';
import { getCheckoutSession } from '$lib/server/stripe';
import { getTranscript, deleteTranscript } from '$lib/server/assessment/transcript-store';
import { getPipelineStatus, setPipelineStatus } from '$lib/server/assessment/pipeline-store';
import { runReportPipeline } from '$lib/server/assessment/pipeline';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const payload = await request.json().catch(() => null);

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
  const source: string = payload.source || stripeSession.metadata?.source || 'website-chatbot';
  let customerName: string = payload.customerName || stripeSession.metadata?.customer_name || stripeSession.customer_details?.name || '';
  let customerEmail: string = payload.customerEmail || stripeSession.metadata?.customer_email || stripeSession.customer_details?.email || '';
  let customerPhone: string = payload.customerPhone || stripeSession.metadata?.customer_phone || '';
  let company: string = payload.company || stripeSession.metadata?.company || '';

  // For voice-agent flows: retrieve transcript stored by Retell webhook
  if (!hasTranscript && retellCallId) {
    const stored = getTranscript(retellCallId);
    if (stored?.transcript) {
      transcript = stored.transcript;
      customerName = customerName || (stored.metadata.customer_name as string) || '';
      customerEmail = customerEmail || (stored.metadata.customer_email as string) || '';
      customerPhone = customerPhone || (stored.metadata.customer_phone as string) || '';
      company = company || (stored.metadata.company as string) || '';
      deleteTranscript(retellCallId);
    }
  }

  if (!transcript) {
    setPipelineStatus(payload.sessionId, { status: 'pending_transcript' });
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

  // Step 3: Run the report pipeline (async — don't block client)
  setPipelineStatus(payload.sessionId, { status: 'queued' });
  runReportPipeline({
    receivedAt: new Date().toISOString(),
    source,
    sessionId: payload.sessionId,
    customerName,
    customerEmail,
    customerPhone,
    company,
    transcript
  }).then((result) => {
    setPipelineStatus(payload.sessionId, {
      status: 'completed',
      deckUrl: result.deckUrl || undefined,
      reportId: result.savedReport?.id
    });
    console.info('Pipeline completed for', payload.sessionId, result.savedReport?.id || 'no report');
  }).catch((error) => {
    setPipelineStatus(payload.sessionId, { status: 'error', error: String(error) });
    console.error('Pipeline failed for', payload.sessionId, error);
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

  const result = getPipelineStatus(sessionId);
  if (!result) return json({ status: 'unknown' });

  return json({
    sessionId,
    status: result.status,
    deckUrl: result.deckUrl || undefined,
    reportId: result.reportId || undefined,
    error: result.error || undefined
  });
};
