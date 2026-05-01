import { env } from '$env/dynamic/private';
import { json, text } from '@sveltejs/kit';
import { createAssessmentReportJob } from '$lib/server/assessment/retell-job';
import { storeTranscript } from '$lib/server/assessment/transcript-store';
import { runReportPipeline } from '$lib/server/assessment/pipeline';
import { sendWelcomeEmail } from '$lib/server/assessment/emails';
import { verifyRetellSignature } from '$lib/server/retell';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const rawBody = await request.text();

  if (env.RETELL_API_KEY) {
    const signature = request.headers.get('x-retell-signature') || '';
    const verified = await verifyRetellSignature(rawBody, env.RETELL_API_KEY, signature);

    if (!verified) {
      return text('Unauthorized', { status: 401 });
    }
  }

  let payload: {
    event?: string;
    call?: Record<string, any>;
  };

  try {
    payload = JSON.parse(rawBody || '{}');
  } catch {
    return json({ message: 'Invalid Retell webhook JSON.' }, { status: 400 });
  }

  if (!payload.event) {
    return json({ message: 'Missing Retell webhook event.' }, { status: 400 });
  }

  const shouldProcess =
    payload.event === 'call_analyzed' ||
    (payload.event === 'call_ended' && env.ASSESSMENT_REPORT_PROCESS_CALL_ENDED === 'true');

  if (!shouldProcess) {
    return new Response(null, { status: 204 });
  }

  const job = createAssessmentReportJob(payload);

  if (!job) {
    console.warn('Retell webhook did not include enough transcript data for report processing.');
    return new Response(null, { status: 204 });
  }

  // Always store transcript for pickup by assessment-transcript endpoint
  storeTranscript(job.callId!, job.transcript, {
    customer_name: job.customerName,
    customer_email: job.customerEmail,
    customer_phone: job.customerPhone,
    company: job.company,
    source: job.source
  });

  // Send welcome email after intake (non-blocking)
  if (job.customerEmail) {
    try {
      const welcome = await sendWelcomeEmail({
        to: job.customerEmail,
        customerName: job.customerName,
        company: job.company
      });
      if (welcome.sent) {
        console.info('Welcome email sent', { to: job.customerEmail, id: welcome.id });
      }
    } catch (err) {
      console.error('Welcome email failed:', err);
    }
  }

  // Run the pipeline if payment already marked complete
  // Otherwise transcript stays stored until payment triggers analysis
  if (job.paymentStatus === 'paid' || job.paymentStatus === 'complete') {
    try {
      const result = await runReportPipeline(job);
      console.info('Assessment report job handled', JSON.stringify({ callId: job.callId, ...result }));
    } catch (error) {
      console.error('Assessment report agent handoff failed:', error);
      return json({ message: 'Report agent handoff failed.' }, { status: 502 });
    }
  } else {
    console.info('Transcript stored for later processing upon payment', { callId: job.callId });
  }

  return new Response(null, { status: 204 });
};
