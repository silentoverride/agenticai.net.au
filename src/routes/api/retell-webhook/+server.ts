import { env } from '$env/dynamic/private';
import { json, text } from '@sveltejs/kit';
import { createAssessmentReportJob } from '$lib/server/assessment/retell-job';
import { storeTranscript } from '$lib/server/assessment/transcript-store';
import { enqueueReportJob } from '$lib/server/assessment/queue';
import { verifyRetellSignature } from '$lib/server/retell';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
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

  // Always store transcript durably for pickup by assessment-transcript endpoint
  await storeTranscript(job.callId!, job.transcript, {
    customer_name: job.customerName,
    customer_email: job.customerEmail,
    customer_phone: job.customerPhone,
    company: job.company,
    source: job.source,
    call_duration_ms: job.callDurationMs,
    disconnection_reason: job.disconnectionReason,
    recording_url: job.recordingUrl,
    call_cost_cents: job.callCostCents,
    call_direction: job.callDirection,
    from_number: job.fromNumber,
    to_number: job.toNumber,
    retell_summary: job.retellSummary,
    caller_role: job.callerRole,
    industry: job.industry,
    team_size: job.teamSize,
    current_tools: job.currentTools,
    top_pain_points: job.topPainPoints,
    repeated_tasks: job.repeatedTasks,
    operating_rhythm: job.operatingRhythm,
    lead_customer_response_workflow: job.leadCustomerResponseWorkflow,
    knowledge_documentation_gaps: job.knowledgeDocumentationGaps,
    reporting_visibility_gaps: job.reportingVisibilityGaps,
    estimated_time_loss: job.estimatedTimeLoss,
    revenue_or_customer_impact: job.revenueOrCustomerImpact,
    lead_response_gap: job.leadResponseGap,
    knowledge_gap: job.knowledgeGap,
    manual_reporting_gap: job.manualReportingGap,
    priority_outcome: job.priorityOutcome,
    privacy_or_compliance_constraints: job.privacyOrComplianceConstraints,
    open_questions: job.openQuestionsForFollowUp,
    assessment_ready: job.assessmentReady,
    verbal_approval_given: job.verbalApprovalGiven,
    payment_link_sent: job.paymentLinkSent,
    payment_status: job.paymentStatus
  });

  // Run the pipeline if payment already marked complete
  // Otherwise transcript stays stored until payment triggers analysis
  if (job.paymentStatus === 'paid' || job.paymentStatus === 'complete') {
    const queue = platform?.env?.assessment_queue;
    const { queued, inline } = await enqueueReportJob(queue, job);
    if (!queued && !inline) {
      return json({ message: 'Failed to queue pipeline job.' }, { status: 502 });
    }
  } else {
    console.info('Transcript stored for later processing upon payment', { callId: job.callId });
  }

  return new Response(null, { status: 204 });
};
