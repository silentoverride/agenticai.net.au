import { env } from '$env/dynamic/private';

type RetellWebhookPayload = {
  event?: string;
  call?: Record<string, any>;
};

export type AssessmentReportJob = {
  receivedAt: string;
  source: string;
  event: string;
  callId: string;
  agentId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  company?: string;
  paymentStatus?: string;
  transcript: string;
  transcriptObject?: unknown;
  transcriptWithToolCalls?: unknown;
  analysis?: unknown;
  metadata?: unknown;
  dynamicVariables?: unknown;
};

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0);
}

export function createAssessmentReportJob(payload: RetellWebhookPayload): AssessmentReportJob | null {
  const call = payload.call || {};
  const dynamicVariables = (call.retell_llm_dynamic_variables || {}) as Record<string, unknown>;
  const metadata = (call.metadata || {}) as Record<string, unknown>;
  const callAnalysis = (call.call_analysis || {}) as Record<string, any>;
  const customAnalysis = (callAnalysis.custom_analysis_data || callAnalysis.custom_analysis || {}) as Record<
    string,
    unknown
  >;
  const transcript = firstString(call.transcript, call.transcript_text);

  if (!payload.event || !call.call_id || !transcript) {
    return null;
  }

  return {
    receivedAt: new Date().toISOString(),
    source: 'retell-voice-agent',
    event: payload.event,
    callId: String(call.call_id),
    agentId: firstString(call.agent_id),
    customerName: firstString(
      customAnalysis.caller_name,
      customAnalysis.customer_name,
      dynamicVariables.customer_name,
      metadata.customer_name
    ),
    customerEmail: firstString(
      customAnalysis.caller_email,
      customAnalysis.customer_email,
      dynamicVariables.customer_email,
      metadata.customer_email
    ),
    customerPhone: firstString(
      customAnalysis.caller_phone,
      customAnalysis.customer_phone,
      dynamicVariables.customer_phone,
      metadata.customer_phone,
      call.from_number
    ),
    company: firstString(customAnalysis.company, dynamicVariables.company, metadata.company),
    paymentStatus: firstString(customAnalysis.payment_status, dynamicVariables.payment_status, metadata.payment_status),
    transcript,
    transcriptObject: call.transcript_object,
    transcriptWithToolCalls: call.transcript_with_tool_calls,
    analysis: call.call_analysis,
    metadata: call.metadata,
    dynamicVariables: call.retell_llm_dynamic_variables
  };
}

export async function pipeAssessmentReportJob(job: AssessmentReportJob) {
  if (!env.ASSESSMENT_REPORT_AGENT_WEBHOOK_URL) {
    console.info('Assessment report job ready', JSON.stringify(job));
    return {
      queued: false,
      destination: 'server-log'
    };
  }

  const response = await fetch(env.ASSESSMENT_REPORT_AGENT_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(env.ASSESSMENT_REPORT_AGENT_WEBHOOK_SECRET
        ? { authorization: `Bearer ${env.ASSESSMENT_REPORT_AGENT_WEBHOOK_SECRET}` }
        : {})
    },
    body: JSON.stringify(job)
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || `Report agent returned ${response.status}.`);
  }

  return {
    queued: true,
    destination: env.ASSESSMENT_REPORT_AGENT_WEBHOOK_URL
  };
}
