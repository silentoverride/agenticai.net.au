import type { AsyncDb } from '$lib/server/db';
import type {
  BlockedReason,
  HumanReviewState,
  StaffActionDescriptor,
  StaffArtifactVersionDto,
  StaffAssessmentReviewDto,
  StaffBlockedReasonDto,
  StaffGateFindingDto,
  StaffReportContextDto
} from '$lib/staff-portal/dto';
import {
  BLOCKED_REASONS,
  HUMAN_REVIEW_STATES,
  RISK_SIGNALS
} from '../domain/states';
import { mapBrownfieldReportState } from '../mappers/brownfield-report-state';
import { mapGateFindingState } from '../mappers/gate-finding-state';
import { getAvailableActions } from '../services/get-available-actions';
import {
  REPORT_STATE_PRESENTATION,
  BLOCKED_REASON_PRESENTATION,
  RISK_SIGNAL_PRESENTATION
} from '$lib/staff-portal/dto';

export interface GetAssessmentReviewInput {
  db: AsyncDb;
  assessmentId: string;
  actorId: string;
  role: 'admin' | 'operator';
}

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

interface AssessmentBaseRow {
  session_id: string;
  customer_name: string | null;
  company: string | null;
  pipeline_status: string | null;
  review_status: string | null;
  review_operator_id: string | null;
  review_edited_content: string | null;
  artifact_r2_key: string | null;
  deck_url: string | null;
  report_id: string | null;
  report_created_at: string | null;
  blocking_count: number;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
}

interface GateFindingRow {
  gate_run_id: string;
  assessment_id: string;
  gate_type: string;
  verdict: string;
  confidence: number;
  reasoning: string | null;
  details: string | null;
  model: string | null;
  created_at: string;
  review_status: string | null;
  review_notes: string | null;
  review_edited_content: string | null;
  review_decision: string | null;
  flagged_section?: string | null;
  related_intake_evidence?: string | null;
  inspection_steps?: string | null;
  severity?: string | null;
}

interface ArtifactRow {
  id: string;
  session_id: string | null;
  r2_key: string | null;
  deck_url: string | null;
  title: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Read model
// ---------------------------------------------------------------------------

export async function getAssessmentReview(
  input: GetAssessmentReviewInput
): Promise<StaffAssessmentReviewDto> {
  const { db, assessmentId, actorId, role } = input;

  // 1. Load base assessment record — bounded single-row query
  const base = await db.queryOne<AssessmentBaseRow>(
    `SELECT
      ps.session_id,
      ao.customer_name,
      ao.company,
      ps.status AS pipeline_status,
      har.status AS review_status,
      har.operator_id AS review_operator_id,
      har.edited_content AS review_edited_content,
      r.r2_key AS artifact_r2_key,
      r.deck_url,
      r.id AS report_id,
      r.created_at AS report_created_at,
      (SELECT COUNT(*) FROM assessment_gates ag
       WHERE ag.assessment_id = ps.session_id
         AND ag.verdict IN ('block', 'retry', 'escalate', 'human_assist')) AS blocking_count,
      ps.created_at,
      ps.updated_at,
      har.reviewed_at
    FROM pipeline_status ps
    LEFT JOIN reports r ON r.session_id = ps.session_id
    LEFT JOIN assessment_orders ao ON ao.session_id = ps.session_id
    LEFT JOIN human_assist_reviews har ON har.assessment_id = ps.session_id
    WHERE ps.session_id = ?
    LIMIT 1`,
    assessmentId
  );

  if (!base) {
    throw permissionDenied();
  }

  // 2. Build governed report state
  const governedState = mapBrownfieldReportState({
    pipelineStatus: base.pipeline_status,
    humanAssistStatus: base.review_status,
    artifactPresent: Boolean(base.artifact_r2_key || base.deck_url),
    approvalEvidence: false,
    unresolvedBlockingFindings: base.blocking_count
  });

  // 3. Load linked gate findings — bounded query by assessment_id
  const gateRows = await db.queryAll<GateFindingRow>(
    `SELECT
      ag.gate_run_id,
      ag.assessment_id,
      ag.gate_type,
      ag.verdict,
      ag.confidence,
      ag.reasoning,
      ag.details,
      ag.model,
      ag.created_at,
      har.status AS review_status,
      har.operator_notes AS review_notes,
      har.edited_content AS review_edited_content,
      har.status AS review_decision
    FROM assessment_gates ag
    LEFT JOIN human_assist_reviews har ON har.assessment_id = ag.assessment_id AND har.gate_run_id = ag.gate_run_id
    
    WHERE ag.assessment_id = ?
    ORDER BY ag.created_at DESC
    LIMIT 50`,
    assessmentId
  );

  const linkedGateFindings: StaffGateFindingDto[] = gateRows.map((row) => toGateFindingDto(row, {
    role, operatorId: actorId, assignedOperatorId: base.review_operator_id, sharedQueue: !base.review_operator_id
  }));

  // 4. Load artifact history — bounded query from reports table
  const artifactRows = await db.queryAll<ArtifactRow>(
    `SELECT id, session_id, r2_key, deck_url, title, created_at
     FROM reports
     WHERE session_id = ?
     ORDER BY created_at DESC
     LIMIT 20`,
    assessmentId
  );

  const artifactHistory: StaffArtifactVersionDto[] = artifactRows.map((row) => toArtifactDto(row, assessmentId));

  // 5. Build report context
  const reportContext: StaffReportContextDto = {
    businessName: base.customer_name ?? base.company ?? 'Unknown Business',
    owner: base.review_operator_id ?? null,
    journeyStage: governedState.state,
    riskFlags: governedState.risk !== RISK_SIGNALS.NONE ? [governedState.risk] : [],
    valueFlags: []
  };

  // 6. Get available actions
  const availableActions = getAvailableActions({
    targetType: 'report',
    state: governedState,
    actor: { role, operatorId: actorId, assignedOperatorId: base.review_operator_id, sharedQueue: !base.review_operator_id }
  });

  // 7. State presentation
  const statePresentation = REPORT_STATE_PRESENTATION[governedState.state];

  // 8. Blocked reasons
  const blockedReasons: StaffBlockedReasonDto[] = governedState.blockedReasons.map(
    (reason) => toBlockedReasonDto(reason)
  );

  return {
    assessmentId: base.session_id,
    clientName: base.customer_name ?? base.company ?? 'Unknown',
    reportState: governedState.state,
    humanReviewState: mapReviewStatus(base.review_status),
    canDeliver: governedState.canDeliver,
    reportContext,
    linkedGateFindings,
    artifactHistory,
    availableActions,
    statePresentation,
    blockedReasons
  };
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function toGateFindingDto(
  row: GateFindingRow & { flagged_section?: string | null; related_intake_evidence?: string | null; inspection_steps?: string | null; severity?: string | null },
  actor?: { role: 'admin' | 'operator'; operatorId?: string; assignedOperatorId?: string | null; sharedQueue?: boolean }
): StaffGateFindingDto {
  const governedState = mapGateFindingState({
    gateVerdict: row.verdict,
    humanAssistStatus: row.review_status,
    approvalEvidence: false,
    overrideReason: row.review_edited_content
  });

  const riskPresentation = RISK_SIGNAL_PRESENTATION[governedState.risk];

  const actions: StaffActionDescriptor[] = actor
    ? getAvailableActions({ targetType: 'gateFinding', state: governedState, actor })
    : [];

  return {
    id: row.gate_run_id,
    type: row.gate_type,
    verdict: row.verdict,
    confidence: row.confidence,
    severity: row.severity ?? null,
    reasoning: row.reasoning,
    details: row.details,
    flaggedReportSection: row.flagged_section ?? null,
    relatedIntakeEvidence: row.related_intake_evidence ?? null,
    suggestedInspectionSteps: row.inspection_steps ?? null,
    state: governedState.state,
    decisionNotes: row.review_notes ?? row.review_decision ?? null,
    riskSignal: {
      tone: riskPresentation.tone,
      label: riskPresentation.label,
      description: riskPresentation.description,
      testId: riskPresentation.testId
    },
    actions
  };
}

function toArtifactDto(row: ArtifactRow & { session_id: string | null; r2_key: string | null; deck_url: string | null; title: string | null; created_at: string }, assessmentId: string): StaffArtifactVersionDto {
  const isOriginal = !row.title?.toLowerCase().includes('edited')
    && !row.title?.toLowerCase().includes('regenerated')
    && !row.title?.toLowerCase().includes('historical');

  return {
    versionId: row.id,
    type: isOriginal ? 'original' : 'edited',
    createdAt: row.created_at,
    label: row.title ?? `Report ${row.id.slice(0, 8)}`,
    available: Boolean(row.r2_key || row.deck_url),
    url: row.deck_url ?? undefined
  };
}

function toBlockedReasonDto(reason: BlockedReason): StaffBlockedReasonDto {
  const meta = BLOCKED_REASON_PRESENTATION[reason];
  return {
    reason,
    label: meta.label,
    tone: meta.tone,
    description: meta.description,
    remediationHint: meta.remediationHint,
    testId: meta.testId
  };
}

function mapReviewStatus(value: string | null | undefined): HumanReviewState {
  switch ((value ?? '').trim().toLowerCase()) {
    case 'pending': return HUMAN_REVIEW_STATES.PENDING;
    case 'in_review': return HUMAN_REVIEW_STATES.IN_REVIEW;
    case 'approved': return HUMAN_REVIEW_STATES.APPROVED;
    case 'rejected': return HUMAN_REVIEW_STATES.REJECTED;
    case 'edited': return HUMAN_REVIEW_STATES.EDITED;
    default: return HUMAN_REVIEW_STATES.NONE;
  }
}

function permissionDenied(): never {
  const err = new Error('You do not have access to this assessment.') as Error & { status: number };
  err.status = 403;
  throw err;
}
