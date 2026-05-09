import { json } from '@sveltejs/kit';
import { runReportPipeline } from '$lib/server/assessment/pipeline';
import { setPipelineStatus } from '$lib/server/assessment/pipeline-store';
import type { RequestHandler } from './$types';

/**
 * POST /api/test/generate-report
 *
 * Local dev-only endpoint to generate a report directly without Stripe.
 * Triggered from the test voice-agent page or via curl.
 */
export const POST: RequestHandler = async ({ request, platform }) => {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const sessionId = (body.sessionId as string) || `test-${Date.now()}`;
  const transcript = (body.transcript as string) || `Business Owner: Hi, I'm looking to improve my business operations.

Business Owner: We have about 12 people in the field doing service work. I do all the scheduling myself in Excel spreadsheets.

Business Owner: Customer enquiries come into a shared Gmail inbox and I handle all the quotes manually.

Business Owner: I spend about 3 hours every day just on admin tasks like invoicing and following up payments.

Business Owner: I'd love to automate the scheduling and maybe get a better system for customer enquiries.

Business Owner: My name is John and my company is Test Plumbing Services.

Business Owner: Budget is flexible if it saves me time.`;

  const job = {
    sessionId,
    callId: (body.callId as string) || `call_test_${Date.now()}`,
    source: (body.source as string) || 'test-platform',
    customerName: (body.customerName as string) || 'John Test',
    customerEmail: (body.customerEmail as string) || 'johnexample@sharklasers.com',
    customerPhone: (body.customerPhone as string) || '+61400000000',
    company: (body.company as string) || 'Test Plumbing Services',
    transcript,
    receivedAt: new Date().toISOString()
  };

  try {
    await setPipelineStatus(sessionId, { status: 'queued' });
    const result = await runReportPipeline(job, { r2Bucket: platform?.env?.assessment_blobs ?? null });
    await setPipelineStatus(sessionId, {
      status: 'completed',
      reportId: result.savedReport?.id
    });

    return json({
      ok: true,
      reportId: result.savedReport?.id,
      sessionId,
      status: 'completed'
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await setPipelineStatus(sessionId, { status: 'error', error: msg });
    return json({ ok: false, error: msg, sessionId }, { status: 500 });
  }
};
