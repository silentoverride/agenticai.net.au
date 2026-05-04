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
  status: 'queued' | 'pending_transcript' | 'completed' | 'error';
  deckUrl?: string;
  reportId?: string;
  error?: string;
};

export interface SavedReport {
  id: string;
  dir: string;
  jsonPath: string;
  mdPath: string;
  deckUrl?: string;
}

export interface PipelineResult {
  queued: boolean;
  savedReport?: SavedReport;
  deckUrl?: string;
  destination: string;
  emailSent?: boolean;
  emailId?: string;
}
