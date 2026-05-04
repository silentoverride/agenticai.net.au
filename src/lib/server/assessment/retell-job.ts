import type { AssessmentReportJob } from './types';

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0);
}

function firstBoolean(...values: unknown[]) {
  const val = values.find((v) => typeof v === 'boolean');
  return typeof val === 'boolean' ? val : undefined;
}

function firstNumber(...values: unknown[]) {
  const val = values.find((v) => typeof v === 'number' && !Number.isNaN(v));
  return typeof val === 'number' ? val : undefined;
}

function costToCents(cost: unknown): number | undefined {
  if (typeof cost === 'number' && !Number.isNaN(cost)) {
    return Math.round(cost * 100);
  }
  if (typeof cost === 'string') {
    const parsed = parseFloat(cost);
    if (!Number.isNaN(parsed)) return Math.round(parsed * 100);
  }
  return undefined;
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

  // Extract custom analysis fields from Retell post_call_analysis_data
  const callerRole = firstString(customAnalysis.caller_role, dynamicVariables.caller_role, metadata.caller_role);
  const industry = firstString(customAnalysis.industry, dynamicVariables.industry, metadata.industry);
  const teamSize = firstString(customAnalysis.team_size, dynamicVariables.team_size, metadata.team_size);
  const currentTools = firstString(customAnalysis.current_tools, dynamicVariables.current_tools, metadata.current_tools);
  const topPainPoints = firstString(customAnalysis.top_pain_points, dynamicVariables.top_pain_points, metadata.top_pain_points);
  const repeatedTasks = firstString(customAnalysis.repeated_tasks, dynamicVariables.repeated_tasks, metadata.repeated_tasks);
  const operatingRhythm = firstString(customAnalysis.operating_rhythm, dynamicVariables.operating_rhythm, metadata.operating_rhythm);
  const leadCustomerResponseWorkflow = firstString(
    customAnalysis.lead_customer_response_workflow,
    dynamicVariables.lead_customer_response_workflow,
    metadata.lead_customer_response_workflow
  );
  const knowledgeDocumentationGaps = firstString(
    customAnalysis.knowledge_documentation_gaps,
    dynamicVariables.knowledge_documentation_gaps,
    metadata.knowledge_documentation_gaps
  );
  const reportingVisibilityGaps = firstString(
    customAnalysis.reporting_visibility_gaps,
    dynamicVariables.reporting_visibility_gaps,
    metadata.reporting_visibility_gaps
  );
  const estimatedTimeLoss = firstString(
    customAnalysis.estimated_time_loss_mentioned,
    dynamicVariables.estimated_time_loss_mentioned,
    metadata.estimated_time_loss_mentioned
  );
  const revenueOrCustomerImpact = firstString(
    customAnalysis.revenue_or_customer_impact_mentioned,
    dynamicVariables.revenue_or_customer_impact_mentioned,
    metadata.revenue_or_customer_impact_mentioned
  );
  const leadResponseGap = firstBoolean(customAnalysis.lead_response_gap, dynamicVariables.lead_response_gap, metadata.lead_response_gap);
  const knowledgeGap = firstBoolean(customAnalysis.knowledge_gap, dynamicVariables.knowledge_gap, metadata.knowledge_gap);
  const manualReportingGap = firstBoolean(customAnalysis.manual_reporting_gap, dynamicVariables.manual_reporting_gap, metadata.manual_reporting_gap);
  const priorityOutcome = firstString(customAnalysis.priority_outcome, dynamicVariables.priority_outcome, metadata.priority_outcome);
  const privacyOrComplianceConstraints = firstString(
    customAnalysis.privacy_or_compliance_constraints,
    dynamicVariables.privacy_or_compliance_constraints,
    metadata.privacy_or_compliance_constraints
  );
  const openQuestionsForFollowUp = firstString(
    customAnalysis.open_questions_for_follow_up,
    dynamicVariables.open_questions_for_follow_up,
    metadata.open_questions_for_follow_up
  );
  const assessmentReady = firstBoolean(customAnalysis.assessment_ready, dynamicVariables.assessment_ready, metadata.assessment_ready);
  const verbalApprovalGiven = firstBoolean(customAnalysis.verbal_approval_given, dynamicVariables.verbal_approval_given, metadata.verbal_approval_given);
  const paymentLinkSent = firstBoolean(customAnalysis.payment_link_sent, dynamicVariables.payment_link_sent, metadata.payment_link_sent);

  return {
    receivedAt: new Date().toISOString(),
    source: 'retell-voice-agent',
    event: payload.event,
    callId: String(call.call_id),
    agentId: firstString(call.agent_id),
    customerName: firstString(
      customAnalysis.caller_name,
      customAnalysis.customer_name,
      dynamicVariables.caller_name,
      dynamicVariables.customer_name,
      metadata.caller_name,
      metadata.customer_name
    ),
    customerEmail: firstString(
      customAnalysis.caller_email,
      customAnalysis.customer_email,
      dynamicVariables.caller_email,
      dynamicVariables.customer_email,
      metadata.caller_email,
      metadata.customer_email
    ),
    customerPhone: firstString(
      customAnalysis.caller_phone,
      customAnalysis.customer_phone,
      dynamicVariables.caller_phone,
      dynamicVariables.customer_phone,
      metadata.caller_phone,
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
    dynamicVariables: call.retell_llm_dynamic_variables,

    // Call metadata
    callDurationMs: firstNumber(call.duration_ms),
    callStartTimestamp: firstNumber(call.start_timestamp),
    callEndTimestamp: firstNumber(call.end_timestamp),
    disconnectionReason: firstString(call.disconnection_reason),
    recordingUrl: firstString(call.recording_url),
    stereoRecordingUrl: firstString(call.stereo_recording_url),
    callCostCents: costToCents(call.call_cost?.total_cost),
    callDirection: firstString(call.direction),
    fromNumber: firstString(call.from_number),
    toNumber: firstString(call.to_number),
    retellSummary: firstString(call.summary, callAnalysis.summary),

    // Extracted analysis
    callerRole,
    industry,
    teamSize,
    currentTools,
    topPainPoints,
    repeatedTasks,
    operatingRhythm,
    leadCustomerResponseWorkflow,
    knowledgeDocumentationGaps,
    reportingVisibilityGaps,
    estimatedTimeLoss,
    revenueOrCustomerImpact,
    leadResponseGap,
    knowledgeGap,
    manualReportingGap,
    priorityOutcome,
    privacyOrComplianceConstraints,
    openQuestionsForFollowUp,
    assessmentReady,
    verbalApprovalGiven,
    paymentLinkSent
  };
}
