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
