import { env } from '$env/dynamic/private';
import { json, text } from '@sveltejs/kit';
import { apiError } from '$lib/server/api-error';
import { createAssessmentReportJob } from '$lib/server/assessment/retell-job';
import { storeTranscript } from '$lib/server/assessment/transcript-store';
import { enqueueReportJob } from '$lib/server/assessment/queue';
import { getPipelineStatusByCallId } from '$lib/server/assessment/pipeline-store';
import { checkIntakeSufficiency } from '$lib/server/assessment/intake-quality-check';
import { verifyRetellSignature } from '$lib/server/retell';
import { RetellWebhookSchema } from '$lib/server/validation';
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

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody || '{}');
  } catch {
    throw apiError(400, 'Invalid Retell webhook JSON.');
  }

  const parsed = RetellWebhookSchema.safeParse(parsedBody);
  if (!parsed.success) {
    throw apiError(400, 'Invalid Retell webhook payload: ' + parsed.error.issues[0]?.message);
  }

  const payload = parsed.data;

  if (!payload.event) {
    throw apiError(400, 'Missing Retell webhook event.');
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

  // If payment already marked complete, run pipeline immediately.
  // If not paid, check if a payment webhook already fired (transcript was missing at that time).
  // If so, the pipeline_status will be 'pending_payment' — catch it up now.
  if (job.paymentStatus === 'paid' || job.paymentStatus === 'complete') {
    // JLA-005: intake quality pre-check before committing pipeline resources
    const qualityCheck = checkIntakeSufficiency(job.transcript);
    if (!qualityCheck.sufficient) {
      console.warn('[retell-webhook] Intake quality check failed — enqueuing anyway (shadow mode)', {
        callId: job.callId,
        gaps: qualityCheck.gaps,
        metrics: qualityCheck.metrics,
        recommendation: qualityCheck.recommendation
      });
      // TODO: when INTAKE_QUALITY_BLOCK=true, skip enqueue and set status to human_assist
    }

    const queue = platform?.env?.assessment_queue;
    const { queued, inline } = await enqueueReportJob(queue, job);
    if (!queued && !inline) {
      throw apiError(502, 'Failed to queue pipeline job.');
    }
  } else {
    const pendingStatus = await getPipelineStatusByCallId(job.callId!);
    if (pendingStatus?.status === 'pending_payment' && pendingStatus.sessionId) {
      console.info('Transcript caught up for already-paid session, enqueuing pipeline', {
        callId: job.callId,
        sessionId: pendingStatus.sessionId
      });
      const queue = platform?.env?.assessment_queue;
      const enrichedJob = { ...job, sessionId: pendingStatus.sessionId };
      const { queued, inline } = await enqueueReportJob(queue, enrichedJob);
      if (!queued && !inline) {
        throw apiError(502, 'Failed to queue pipeline job.');
      }
    } else {
      console.info('Transcript stored for later processing upon payment', { callId: job.callId });
    }
  }

  return new Response(null, { status: 204 });
};
