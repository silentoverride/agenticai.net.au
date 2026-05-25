import type { AsyncDb } from '$lib/server/db';
import type { StaffActivityEventDto, ActivitySourceDomain } from '$lib/staff-portal/dto';

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface GetClientActivityHistoryInput {
  db: AsyncDb;
  assessmentId: string;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Read model
// ---------------------------------------------------------------------------

export async function getClientActivityHistory(
  input: GetClientActivityHistoryInput
): Promise<StaffActivityEventDto[]> {
  const { db, assessmentId, limit = 50 } = input;

  const activities: StaffActivityEventDto[] = [];

  // 1. Pipeline status activity
  const pipelineActivity = await derivePipelineActivity(db, assessmentId);
  activities.push(...pipelineActivity);

  // 2. Gate finding activity
  const gateActivity = await deriveGateActivity(db, assessmentId);
  activities.push(...gateActivity);

  // 3. Human assist review activity
  const reviewActivity = await deriveReviewActivity(db, assessmentId);
  activities.push(...reviewActivity);

  // Sort by timestamp descending, newest first
  activities.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // Apply limit
  return activities.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Pipeline activity
// ---------------------------------------------------------------------------

interface PipelineActivityRow {
  session_id: string;
  status: string;
  updated_at: string;
  created_at: string;
}

async function derivePipelineActivity(
  db: AsyncDb,
  assessmentId: string
): Promise<StaffActivityEventDto[]> {
  const rows = await db.queryAll<PipelineActivityRow>(
    `SELECT session_id, status, updated_at, created_at
     FROM pipeline_status
     WHERE session_id = ?
     LIMIT 1`,
    assessmentId
  );

  return rows.map((row) => {
    const summary = getPipelineStatusSummary(row.status);
    return {
      activityId: `pipeline-${row.session_id}-${row.status}`,
      summary,
      timestamp: row.updated_at ?? row.created_at,
      sourceDomain: 'pipeline' as ActivitySourceDomain,
      actor: null // system-generated activity
    };
  });
}

function getPipelineStatusSummary(status: string): string {
  switch (status) {
    case 'pending':
    case 'queued':
      return 'Assessment report queued for processing';
    case 'pending_transcript':
      return 'Waiting for intake transcript';
    case 'running_llm':
      return 'LLM analysis in progress';
    case 'running_tools':
      return 'Tool-based research running';
    case 'running_deck':
      return 'Report deck generation in progress';
    case 'completed':
      return 'Assessment report completed';
    case 'ready':
      return 'Report ready for review';
    case 'delivered':
      return 'Report delivered to client';
    case 'error':
      return 'Pipeline error encountered';
    case 'retry':
      return 'Pipeline retry initiated';
    default:
      return `Pipeline status: ${status}`;
  }
}

// ---------------------------------------------------------------------------
// Gate finding activity
// ---------------------------------------------------------------------------

interface GateActivityRow {
  gate_run_id: string;
  gate_type: string;
  verdict: string;
  created_at: string;
}

async function deriveGateActivity(
  db: AsyncDb,
  assessmentId: string
): Promise<StaffActivityEventDto[]> {
  const rows = await db.queryAll<GateActivityRow>(
    `SELECT gate_run_id, gate_type, verdict, created_at
     FROM assessment_gates
     WHERE assessment_id = ?
     ORDER BY created_at DESC
     LIMIT 20`,
    assessmentId
  );

  return rows.map((row) => {
    const summary = getGateVerdictSummary(row.gate_type, row.verdict);
    return {
      activityId: `gate-${row.gate_run_id}`,
      summary,
      timestamp: row.created_at,
      sourceDomain: 'gate' as ActivitySourceDomain,
      actor: null // system-generated activity
    };
  });
}

function getGateVerdictSummary(gateType: string, verdict: string): string {
  const typeLabel = gateType.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  switch (verdict) {
    case 'approve':
      return `${typeLabel} gate passed`;
    case 'block':
      return `${typeLabel} gate blocked — requires review`;
    case 'retry':
      return `${typeLabel} gate flagged for retry`;
    case 'escalate':
    case 'human_assist':
      return `${typeLabel} gate escalated for human review`;
    default:
      return `${typeLabel} gate verdict: ${verdict}`;
  }
}

// ---------------------------------------------------------------------------
// Human assist review activity
// ---------------------------------------------------------------------------

interface ReviewActivityRow {
  id: string;
  assessment_id: string;
  gate_type: string | null;
  status: string;
  operator_id: string | null;
  reviewed_at: string | null;
  created_at: string;
}

async function deriveReviewActivity(
  db: AsyncDb,
  assessmentId: string
): Promise<StaffActivityEventDto[]> {
  const rows = await db.queryAll<ReviewActivityRow>(
    `SELECT id, assessment_id, gate_type, status, operator_id, reviewed_at, created_at
     FROM human_assist_reviews
     WHERE assessment_id = ?
     ORDER BY created_at DESC
     LIMIT 20`,
    assessmentId
  );

  return rows.map((row) => {
    const summary = getReviewStatusSummary(row.status, row.gate_type);
    return {
      activityId: `review-${row.id}`,
      summary,
      timestamp: row.reviewed_at ?? row.created_at,
      sourceDomain: 'human_review' as ActivitySourceDomain,
      actor: row.operator_id ?? null
    };
  });
}

function getReviewStatusSummary(status: string, gateType: string | null): string {
  const typeContext = gateType ? ` (${gateType.replace(/-/g, ' ')})` : '';
  switch (status) {
    case 'pending':
      return `Human review requested${typeContext}`;
    case 'in_review':
      return `Human review in progress${typeContext}`;
    case 'approved':
      return `Human review approved${typeContext}`;
    case 'rejected':
      return `Human review rejected${typeContext}`;
    case 'edited':
      return `Report edited during review${typeContext}`;
    default:
      return `Review status: ${status}${typeContext}`;
  }
}
