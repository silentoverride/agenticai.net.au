export type AssessmentReportJob = {
  receivedAt: string;
  source: string;
  event?: string;
  callId?: string;
  sessionId?: string;
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

  // Retell call metadata
  callDurationMs?: number;
  callStartTimestamp?: number;
  callEndTimestamp?: number;
  disconnectionReason?: string;
  recordingUrl?: string;
  stereoRecordingUrl?: string;
  callCostCents?: number;
  callDirection?: string;
  fromNumber?: string;
  toNumber?: string;
  retellSummary?: string;

  // Extracted analysis from Retell post_call_analysis_data
  callerRole?: string;
  industry?: string;
  teamSize?: string;
  currentTools?: string;
  topPainPoints?: string;
  repeatedTasks?: string;
  operatingRhythm?: string;
  leadCustomerResponseWorkflow?: string;
  knowledgeDocumentationGaps?: string;
  reportingVisibilityGaps?: string;
  estimatedTimeLoss?: string;
  revenueOrCustomerImpact?: string;
  leadResponseGap?: boolean;
  knowledgeGap?: boolean;
  manualReportingGap?: boolean;
  priorityOutcome?: string;
  privacyOrComplianceConstraints?: string;
  openQuestionsForFollowUp?: string;
  assessmentReady?: boolean;
  verbalApprovalGiven?: boolean;
  paymentLinkSent?: boolean;
};

export type PipelineStatus = {
  status: 'queued' | 'pending_payment' | 'running_llm' | 'completed' | 'error';
  deckUrl?: string;
  reportId?: string;
  error?: string;
  /** Retry attempt count (used by durable queue; not always present). */
  attempts?: number;
  /** Retell call_id associated with this Stripe session. */
  callId?: string;
};

export interface SavedReport {
  id: string;
  dir: string;
  jsonPath: string;
  mdPath: string;
  r2Key?: string;
}

export interface PipelineResult {
  queued: boolean;
  savedReport?: SavedReport;
  destination: string;
  emailSent?: boolean;
  emailId?: string;
}

// ============================================================================
// AI Analysis Data Types — structured output from LLM analysis
// ============================================================================

/** A pain point identified during the assessment. */
export interface AnalysisPainPoint {
  title: string;
  description: string;
  severity?: 'high' | 'medium' | 'low';
  frequency?: string;
  search_queries?: string[];
}

/** A quick win recommendation — high impact, low effort. */
export interface AnalysisQuickWin {
  title: string;
  description: string;
  effort?: 'low' | 'medium' | 'high';
  impact?: string;
  estimated_hours_saved_per_week?: number;
  recommended_tools?: string[];
}

/** A researched AI tool with metadata. */
export interface AnalysisResearchedTool {
  name: string;
  url?: string;
  description?: string;
  pricing?: string;
  category?: string;
  source?: 'futurepedia' | 'taaft' | 'perplexity';
  setup_complexity?: string;
  setup_time?: string;
  setup_time_estimate?: string;
  estimated_hours_saved_per_week?: number;
}

/** A deeper opportunity — higher value but more effort. */
export interface AnalysisDeeperOpportunity {
  title: string;
  description: string;
  estimated_setup_cost_aud?: number;
  estimated_monthly_value_aud?: number;
}

/** Financial impact estimates. */
export interface AnalysisFinancialImpact {
  hours_saved_per_week?: number;
  hourly_rate_assumed_aud?: number;
  weekly_value_aud?: number;
  monthly_value_aud?: number;
  annual_value_aud?: number;
  net_annual_value_aud?: number;
  estimated_tool_costs_monthly_aud?: number;
}

/** Legacy tool recommendation shape (from older analysis format). */
export interface AnalysisToolRecommendation {
  name: string;
  category?: string;
  purpose?: string;
  estimated_monthly_cost_aud?: number;
  setup_complexity?: string;
}

/** The complete structured analysis object produced by the LLM. */
export interface AnalysisData {
  executive_summary?: string;
  pain_points?: AnalysisPainPoint[];
  quick_wins?: AnalysisQuickWin[];
  deeper_opportunities?: AnalysisDeeperOpportunity[];
  researched_tools?: AnalysisResearchedTool[];
  tool_recommendations?: AnalysisToolRecommendation[];
  financial_impact?: AnalysisFinancialImpact;
  implementation_roadmap?: {
    phase: string;
    week: string;
    actions: string[];
  }[];
}
