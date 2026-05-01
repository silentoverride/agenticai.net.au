import type { AssessmentReportJob } from './types';

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0);
}

export function createAssessmentReportJob(payload: { event?: string; call?: Record<string, any> }): AssessmentReportJob | null {
  const call = payload.call || {};
  const dynamicVariables = (call.retell_llm_dynamic_variables || {}) as Record<string, unknown>;
  const metadata = (call.metadata || {}) as Record<string, unknown>;
  const callAnalysis = (call.call_analysis || {}) as Record<string, any>;
  const customAnalysis = (callAnalysis.custom_analysis_data || callAnalysis.custom_analysis || {}) as Record<string, unknown>;
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
