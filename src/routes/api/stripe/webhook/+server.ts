import { env } from '$env/dynamic/private';
import { text } from '@sveltejs/kit';
import { verifyStripeSignature } from '$lib/server/stripe';
import { sendReceiptEmail } from '$lib/server/assessment/emails';
import { getTranscript, deleteTranscript } from '$lib/server/assessment/transcript-store';
import { setPipelineStatus } from '$lib/server/assessment/pipeline-store';
import { runReportPipeline } from '$lib/server/assessment/pipeline';
import { saveReceipt, savePendingReceipt, findOrCreateUserFromStripe, upsertUser } from '$lib/server/portal';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return text('Webhook secret not configured', { status: 501 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  const isValid = await verifyStripeSignature(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);

  if (!isValid) {
    return text('Invalid signature', { status: 401 });
  }

  let event: Record<string, any>;

  try {
    event = JSON.parse(rawBody || '{}');
  } catch {
    return text('Invalid JSON payload', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data?.object || {};
    const metadata = session.metadata || {};

    const record = {
      receivedAt: new Date().toISOString(),
      event: event.type,
      stripeSessionId: session.id,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_details?.email || metadata.customer_email || null,
      customerPhone: session.customer_details?.phone || metadata.customer_phone || null,
      customerName: metadata.customer_name || null,
      company: metadata.company || null,
      source: metadata.source || 'unknown',
      transcriptPreview: metadata.transcript_preview || null,
      assessmentFeeAud: metadata.assessment_fee_aud || null
    };

    console.info('Stripe payment confirmed', JSON.stringify(record));

    // Save receipt to client portal
    if (record.customerEmail && record.amountTotal) {
      try {
        // Try to link to an existing user by email
        const user = findOrCreateUserFromStripe(record.customerEmail, record.customerName);
        if (user) {
          const receipt = saveReceipt(
            user.clerk_id,
            session.id,
            record.amountTotal,
            record.currency || 'aud',
            record.customerEmail,
            record.customerName,
            record.company
          );
          if (receipt) {
            console.info('Receipt saved to portal', { receiptId: receipt.id, userId: user.clerk_id });
          } else {
            console.warn('Receipt save returned null — database may be unavailable');
          }
        } else {
          // Save as pending receipt — will link when user signs up
          const pending = savePendingReceipt(
            session.id,
            record.amountTotal,
            record.currency || 'aud',
            record.customerEmail,
            record.customerName,
            record.company
          );
          if (pending) {
            console.info('Pending receipt saved', { receiptId: pending.id, email: record.customerEmail });
          } else {
            console.warn('Pending receipt save returned null — database may be unavailable');
          }
        }
      } catch (err) {
        console.error('Failed to save receipt to portal:', err);
      }
    }

    // Send receipt email (non-blocking)
    if (record.customerEmail) {
      try {
        const amountFormatted = record.amountTotal
          ? `$${(record.amountTotal / 100).toFixed(2)} ${(record.currency || 'aud').toUpperCase()}`
          : 'N/A';
        const receipt = await sendReceiptEmail({
          to: record.customerEmail,
          customerName: record.customerName || undefined,
          company: record.company || undefined,
          amount: amountFormatted,
          amountCents: record.amountTotal || undefined,
          currency: record.currency || 'aud',
          reference: session.id,
          customerEmail: record.customerEmail,
          issuedAt: record.receivedAt
        });
        if (receipt.sent) {
          console.info('Receipt email sent', { to: record.customerEmail, id: receipt.id });
        }
      } catch (err) {
        console.error('Receipt email failed:', err);
      }
    }

    // For voice-agent flow: if retell_call_id is in metadata, run report pipeline directly
    const retellCallId = metadata.retell_call_id;
    if (retellCallId) {
      const stored = getTranscript(retellCallId);
      if (stored?.transcript) {
        const transcript = stored.transcript;
        const customerName = metadata.customer_name || session.customer_details?.name || '';
        const customerEmail = metadata.customer_email || session.customer_details?.email || '';
        const customerPhone = metadata.customer_phone || session.customer_details?.phone || '';
        const company = metadata.company || '';

        // Fire-and-forget local pipeline
        setPipelineStatus(session.id, { status: 'queued' });
        runReportPipeline({
          receivedAt: record.receivedAt,
          source: 'retell-voice-agent',
          sessionId: session.id,
          customerName,
          customerEmail,
          customerPhone,
          company,
          transcript
        }).then((result) => {
          setPipelineStatus(session.id, {
            status: 'completed',
            deckUrl: result.deckUrl || undefined,
            reportId: result.savedReport?.id
          });
          console.info('Pipeline completed for retell call', { callId: retellCallId, reportId: result.savedReport?.id });
        }).catch((error) => {
          setPipelineStatus(session.id, { status: 'error', error: String(error) });
          console.error('Pipeline failed for retell call', { callId: retellCallId, error: String(error) });
        });

        deleteTranscript(retellCallId);
      } else {
        setPipelineStatus(session.id, { status: 'pending_transcript' });
        console.info('Payment confirmed for retell call, but transcript not yet available', { callId: retellCallId });
      }
    }
  }

  return new Response(null, { status: 200 });
};
