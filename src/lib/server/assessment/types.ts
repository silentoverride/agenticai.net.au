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

// ============================================================================
// Async State Contract (UX-DR30/31)
//
// The canonical set of async pipeline states used across all epics.
// Each state has a stable machine-readable key and a user-facing title.
// ============================================================================

/**
 * Canonical async assessment states.
 * These are the only valid states for the assessment pipeline.
 * Every UI component (user-facing and operator-facing) must use these.
 */
export const ASYNC_STATES = {
  QUEUED: 'queued',
  GENERATING: 'generating',
  DELAYED: 'delayed',
  READY: 'ready',
  FAILED: 'failed',
  HUMAN_ASSIST: 'human_assist'
} as const;

export type AsyncState = (typeof ASYNC_STATES)[keyof typeof ASYNC_STATES];

/**
 * User-facing titles for each async state.
 * These use calm, advisory copy — never alarmist.
 */
export const ASYNC_STATE_TITLES: Record<AsyncState, string> = {
  [ASYNC_STATES.QUEUED]: 'Assessment queued',
  [ASYNC_STATES.GENERATING]: 'Preparing your advisory briefing',
  [ASYNC_STATES.DELAYED]: 'Assessment is taking longer than expected',
  [ASYNC_STATES.READY]: 'Your advisory briefing is ready',
  [ASYNC_STATES.FAILED]: 'We encountered an issue generating your briefing',
  [ASYNC_STATES.HUMAN_ASSIST]: 'A specialist is reviewing your assessment'
};

/**
 * User-facing descriptions for each async state.
 */
export const ASYNC_STATE_DESCRIPTIONS: Record<AsyncState, string> = {
  [ASYNC_STATES.QUEUED]: 'Your assessment has been received and will begin shortly.',
  [ASYNC_STATES.GENERATING]: 'We are analysing your business context and generating recommendations.',
  [ASYNC_STATES.DELAYED]: 'Your assessment is taking longer than usual. We will notify you when it is ready.',
  [ASYNC_STATES.READY]: 'Your Advisory Briefing has been generated and is ready to view.',
  [ASYNC_STATES.FAILED]: 'We could not complete your assessment. Please contact support for assistance.',
  [ASYNC_STATES.HUMAN_ASSIST]: 'A specialist is reviewing your assessment to ensure the highest quality.'
};

// ============================================================================
// Empty / Edge State Contract (UX-DR31)
//
// Defines all possible empty/edge states for content surfaces.
// ============================================================================

/**
 * Possible empty/edge states for any content surface.
 * UI components must handle every state.
 */
export enum ContentState {
  /** No data exists yet — user hasn't started. */
  EMPTY = 'empty',
  /** Intake started but not completed. */
  INCOMPLETE_INTAKE = 'incomplete_intake',
  /** Assessment in progress (see AsyncState for detail). */
  IN_PROGRESS = 'in_progress',
  /** Content exists and is current. */
  AVAILABLE = 'available',
  /** Content exists but is stale (newer version exists). */
  STALE = 'stale',
  /** Only partial data available (e.g., intake done but no briefing yet). */
  PARTIAL = 'partial',
  /** Content generation failed. */
  ERROR = 'error'
}

/**
 * Surface state — combines the async pipeline state with the content state.
 * Used by UI components to determine what to render.
 */
export interface SurfaceState {
  /** The async pipeline state (null if no pipeline run). */
  asyncState: AsyncState | null;
  /** The content state for this surface. */
  contentState: ContentState;
  /** Human-readable message for the current state. */
  message?: string;
  /** Suggested next action for the user. */
  suggestedAction?: string;
}

/**
 * Pre-built surface states for common scenarios.
 */
export const SURFACE_STATES = {
  NO_ASSESSMENT: {
    asyncState: null,
    contentState: ContentState.EMPTY,
    message: 'You have not started an assessment yet.',
    suggestedAction: 'Start an AI Business Assessment'
  } as SurfaceState,
  NO_INTAKE: {
    asyncState: null,
    contentState: ContentState.INCOMPLETE_INTAKE,
    message: 'Your intake conversation is not yet complete.',
    suggestedAction: 'Continue your intake'
  } as SurfaceState,
  NO_BRIEFING: {
    asyncState: null,
    contentState: ContentState.PARTIAL,
    message: 'Your intake is complete. Your briefing is being prepared.',
    suggestedAction: 'Check assessment status'
  } as SurfaceState,
  STALE_BRIEFING: {
    asyncState: ASYNC_STATES.READY,
    contentState: ContentState.STALE,
    message: 'A newer version of your briefing is available.',
    suggestedAction: 'View latest briefing'
  } as SurfaceState
} as const;

// ============================================================================
// Assessment Data Model (UX-DR33)
// ============================================================================

/**
 * A paid assessment order — created when payment is confirmed.
 * Links intake, payment, and briefing together.
 */
export interface AssessmentOrder {
  /** Unique order identifier (UUID). */
  id: string;
  /** Stripe Checkout Session ID. */
  stripeSessionId: string;
  /** Business Summary version this order is based on. */
  businessSummaryVersionId: string | null;
  /** Current pipeline stage. */
  stage: PipelineStage;
  /** Current async state. */
  status: AsyncState;
  /** Reference to the resulting AssessmentBriefing (null if not yet generated). */
  briefingId: string | null;
  /** Customer identifier. */
  customerEmail: string;
  customerName?: string;
  company?: string;
  /** Amount charged (AUD cents). */
  amountCents: number;
  /** Version number — incremented on regeneration. */
  version: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Pipeline stage — each stage corresponds to a stage handler in workers/stages/.
 */
export enum PipelineStage {
  /** Initial stage: full pipeline execution. */
  RUN_PIPELINE = 'run-pipeline',
  /** Tool research (Epic 2a). */
  TOOL_RESEARCH = 'tool-research',
  /** LLM analysis generation (Epic 2a). */
  ANALYSIS_GENERATION = 'analysis-generation',
  /** GPT-5.5 gate evaluation (Epic 2a). */
  GATE_EVALUATION = 'gate-evaluation',
  /** Human assist review (Epic 2b). */
  HUMAN_ASSIST = 'human-assist',
  /** Report delivery (email, portal). */
  DELIVERY = 'delivery'
}

/**
 * Gate verdict — result of a GPT-5.5 gate evaluation.
 */
export enum GateVerdict {
  APPROVE = 'approve',
  RETRY = 'retry',
  BLOCK = 'block',
  ESCALATE = 'escalate',
  HUMAN_ASSIST = 'human_assist'
}

/**
 * The final deliverable — an Advisory Briefing.
 * Produced by the pipeline and stored as an R2 artifact.
 */
export interface AssessmentBriefing {
  /** Unique briefing identifier (UUID). */
  id: string;
  /** The order that produced this briefing. */
  orderId: string;
  /** Pipeline stage that generated this briefing. */
  generatedBy: PipelineStage;
  /** Gate verdicts that approved this briefing. */
  gateVerdicts: Array<{
    gateType: string;
    verdict: GateVerdict;
    confidence: number;
    promptVersion: string;
  }>;
  /** Version number of the Business Summary used. */
  businessSummaryVersion: number;
  /** The assessment order version at generation time. */
  orderVersion: number;
  /** Canonical version — incremented each time this briefing is regenerated. */
  version: number;
  /** Whether this version is the latest. */
  isLatest: boolean;
  /** Content metadata. */
  title: string;
  /** R2 key to the stored artifact. */
  r2Key: string;
  /** Size in bytes of the stored artifact. */
  artifactSizeBytes: number;
  createdAt: string;
  /** When this version was superseded (null if latest). */
  supersededAt: string | null;
}

// ============================================================================
// Schema Contract — Migration Numbering
// ============================================================================

/**
 * Migration numbering convention.
 *
 * Ranges:
 *   0001–0009: Reserved — Portal/Epic 1 (users, receipts, transcripts, reports, pipeline_status)
 *   0010–0019: Reserved — Pipeline/Epic 2a (assessment_orders, gate metadata, source artifacts)
 *   0020–0029: Reserved — Epic 2b (gate modes, calibration, operator actions, drift tracking)
 *   0030–0039: Reserved — Epic 3 (notifications, follow-ups, portal extensions)
 *   0040+:     Future epics
 *
 * Existing:
 *   0001: Init (users, receipts, transcripts, reports, pipeline_status)
 *   0013: Gate metadata (assessment_gates) — created early per policy
 *
 * Rule: Migrations must be created in the correct range for their epic.
 *       Do not reuse or skip numbers within a range.
 */
export const MIGRATION_RANGES = {
  PORTAL_EPIC1: { start: 1, end: 9, label: 'Portal / Epic 1' },
  PIPELINE_EPIC2A: { start: 10, end: 19, label: 'Pipeline / Epic 2a' },
  GATE_EPIC2B: { start: 20, end: 29, label: 'Gate / Epic 2b' },
  PORTAL_EPIC3: { start: 30, end: 39, label: 'Portal / Epic 3' },
  FUTURE: { start: 40, end: Infinity, label: 'Future epics' }
} as const;

export type PipelineStatus = {
  /** Canonical async state — use AsyncState values.
   * Legacy values 'pending_payment', 'running_llm', 'completed' are
   * transitional and should migrate to AsyncState equivalents. */
  status: AsyncState | 'pending_payment' | 'running_llm' | 'completed' | 'error';
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
  /** Whether the pipeline was blocked by a gate (non-shadow mode). */
  blocked?: boolean;
  /** Human-readable reason for blocking (which gate, why). */
  blockReason?: string;
  /** The gate that blocked the pipeline, if any. */
  blockedBy?: {
    gateType: string;
    verdict: string;
    confidence: number;
  };
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

// ============================================================================
// Budget Detection (PRE-3 eval)
// ============================================================================

/** Budget signal extracted from the intake transcript. */
export interface BudgetSignal {
  /** Lower bound of detected budget range (monthly AUD). null if only max detected. */
  min: number | null;
  /** Upper bound of detected budget range (monthly AUD). null if only min detected. */
  max: number | null;
  /** How confident the detection is (0-1). */
  confidence: number;
  /** Where the signal came from. */
  source: BudgetSignalSource;
  /** The raw text that produced this signal. */
  raw_text: string | null;
}

/** How the budget was detected. */
export type BudgetSignalSource =
  | 'transcript_explicit'       // e.g., "I'd spend $500/month"
  | 'transcript_range'          // e.g., "between $300 and $700"
  | 'transcript_implicit'       // e.g., "we pay $X for software now"
  | 'retell_metadata'           // extracted from Retell post_call_analysis
  | 'industry_average'          // industry benchmark fallback
  | 'none';

// ============================================================================
// Multi-Artifact Report Output (HCMW-002)
// Four independently usable artifacts extracted from the LLM analysis,
// plus a cross-artifact consistency report.
// ============================================================================

/** Self-contained executive summary — readable without opening other artifacts. */
export interface ExecutiveSummaryArtifact {
  /** Company/assessment this summary is for. */
  company: string;
  /** 2-3 paragraph executive summary — self-contained. */
  summary: string;
  /** Top 3-5 key findings. */
  key_findings: string[];
  /** The single most important recommendation. */
  top_recommendation: string;
  /** Financial impact in prose: "We estimate $X weekly / $Y annual value from Z hours saved per week." */
  financial_impact_summary: string;
}

/** Detailed findings — pain points, quick wins, deeper opportunities with evidence annotations. */
export interface DetailedFindingsArtifact {
  pain_points: import('./analysis-types').PainPoint[];
  quick_wins: import('./analysis-types').QuickWin[];
  deeper_opportunities: import('./analysis-types').DeeperOpportunity[];
  /** Summary of evidence coverage: "X of Y claims have direct transcript evidence." */
  evidence_summary: string;
  /** When the source analysis was produced. */
  generated_at: string;
}

/** A single tool entry in the tool recommendation matrix. */
export interface ToolMatrixEntry {
  name: string;
  category: string;
  purpose: string;
  estimated_monthly_cost_aud: number;
  setup_complexity: import('./analysis-types').SetupComplexity;
  /** Hours saved per week attributed to this tool. */
  estimated_hours_saved_per_week: number;
  /** Why this tool was selected over alternatives. */
  selection_rationale: string;
}

/** Tool recommendation matrix — tabular listing for procurement decisions. */
export interface ToolMatrixArtifact {
  tools: ToolMatrixEntry[];
  /** Total estimated monthly tool cost (sum of all entries). */
  total_estimated_monthly_cost_aud: number;
  /** Selection rationale for the overall tool set. */
  tool_selection_rationale: string;
}

/** Phased implementation roadmap — actionable execution plan. */
export interface RoadmapArtifact {
  phases: import('./analysis-types').ImplementationPhase[];
  /** Overall timeline summary: "Phase 1 (Weeks 1-2): Quick wins. Phase 2 (Weeks 3-4): Automation. ..." */
  timeline_summary: string;
  /** Dependencies between phases: "Phase 2 requires Phase 1 tool setup." */
  dependencies: string[];
  /** Risk factors: "If staff resist new tools, Phase 1 adoption may slip to Week 3." */
  risk_factors: string[];
}

/** A single consistency issue — contradiction or warning between artifacts. */
export interface ConsistencyIssue {
  /** Which check flagged this. */
  check: string;
  /** Description of the contradiction or warning. */
  description: string;
  /** 'contradiction' (factual conflict) or 'warning' (potential issue). */
  severity: 'contradiction' | 'warning';
  /** Which artifacts are involved. */
  locations: string[];
}

/** Cross-artifact consistency validation report. */
export interface ConsistencyReport {
  /** Whether all checks passed (no contradictions). */
  verified: boolean;
  /** Contradictions found — factual conflicts between artifacts. */
  contradictions: ConsistencyIssue[];
  /** Warnings — potential issues, not definitive conflicts. */
  warnings: ConsistencyIssue[];
  /** Summary of what was checked. */
  checks_performed: string[];
}

/** Complete multi-artifact assessment output. */
export interface AssessmentArtifacts {
  executive_summary: ExecutiveSummaryArtifact;
  detailed_findings: DetailedFindingsArtifact;
  tool_matrix: ToolMatrixArtifact;
  implementation_roadmap: RoadmapArtifact;
  consistency_report: ConsistencyReport;
}
