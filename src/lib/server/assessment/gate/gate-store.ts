/**
 * D1-backed store for gate metadata (assessment_gates table).
 *
 * Created by migration 0013_add_gate_metadata.sql.
 * Records every gate evaluation run: verdict, confidence, token usage, etc.
 */

import type { GateVerdict } from '../types';

/** Record stored for each gate evaluation run. */
export interface GateRunRecord {
  gateRunId: string;
  assessmentId: string;
  gateType: string;
  verdict: GateVerdict;
  confidence: number;
  reasoning?: string;
  details?: string;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  promptVersion?: string;
  reasoningEffort?: string;
  evaluationTimeMs?: number;
  createdAt: string;
}

/**
 * D1 assessment_gates store.
 */
export class D1GateStore {
  constructor(private db: D1Database) {}

  /** Insert a gate run record. */
  async insert(record: GateRunRecord): Promise<void> {
    await this.db
      .prepare(`
        INSERT INTO assessment_gates (
          gate_run_id, assessment_id, gate_type, verdict, confidence,
          reasoning, details, token_usage, model, prompt_version,
          reasoning_effort, evaluation_time_ms, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        record.gateRunId,
        record.assessmentId,
        record.gateType,
        record.verdict,
        record.confidence,
        record.reasoning || null,
        record.details || null,
        record.tokenUsage ? JSON.stringify(record.tokenUsage) : null,
        record.model || null,
        record.promptVersion || 'v1',
        record.reasoningEffort || null,
        record.evaluationTimeMs || null,
        record.createdAt
      )
      .run();
  }

  /** Get all gate runs for an assessment. */
  async getByAssessment(assessmentId: string): Promise<GateRunRecord[]> {
    const result = await this.db
      .prepare(`
        SELECT * FROM assessment_gates
        WHERE assessment_id = ?
        ORDER BY created_at DESC
      `)
      .bind(assessmentId)
      .all<Record<string, unknown>>();

    return (result.results || []).map(this.rowToRecord);
  }

  /** Get gate runs by type. */
  async getByType(gateType: string): Promise<GateRunRecord[]> {
    const result = await this.db
      .prepare(`
        SELECT * FROM assessment_gates
        WHERE gate_type = ?
        ORDER BY created_at DESC
        LIMIT 100
      `)
      .bind(gateType)
      .all<Record<string, unknown>>();

    return (result.results || []).map(this.rowToRecord);
  }

  /** Get recent gate runs for dashboard. */
  async getRecent(limit = 50): Promise<GateRunRecord[]> {
    const result = await this.db
      .prepare(`
        SELECT * FROM assessment_gates
        ORDER BY created_at DESC
        LIMIT ?
      `)
      .bind(limit)
      .all<Record<string, unknown>>();

    return (result.results || []).map(this.rowToRecord);
  }

  /** Get aggregated stats by gate type. */
  async getStats(): Promise<
    Array<{
      gateType: string;
      totalRuns: number;
      approveCount: number;
      retryCount: number;
      blockCount: number;
      escalateCount: number;
      humanAssistCount: number;
      avgConfidence: number;
    }>
  > {
    const result = await this.db
      .prepare(`
        SELECT
          gate_type,
          COUNT(*) as total_runs,
          SUM(CASE WHEN verdict = 'approve' THEN 1 ELSE 0 END) as approve_count,
          SUM(CASE WHEN verdict = 'retry' THEN 1 ELSE 0 END) as retry_count,
          SUM(CASE WHEN verdict = 'block' THEN 1 ELSE 0 END) as block_count,
          SUM(CASE WHEN verdict = 'escalate' THEN 1 ELSE 0 END) as escalate_count,
          SUM(CASE WHEN verdict = 'human_assist' THEN 1 ELSE 0 END) as human_assist_count,
          AVG(confidence) as avg_confidence
        FROM assessment_gates
        GROUP BY gate_type
      `)
      .all<Record<string, unknown>>();

    return (result.results || []).map(r => ({
      gateType: String(r.gate_type),
      totalRuns: Number(r.total_runs),
      approveCount: Number(r.approve_count),
      retryCount: Number(r.retry_count),
      blockCount: Number(r.block_count),
      escalateCount: Number(r.escalate_count),
      humanAssistCount: Number(r.human_assist_count),
      avgConfidence: Number(r.avg_confidence)
    }));
  }

  /** Map a raw DB row to a GateRunRecord. */
  private rowToRecord(row: Record<string, unknown>): GateRunRecord {
    let tokenUsage: GateRunRecord['tokenUsage'] | undefined;
    if (row.token_usage) {
      try {
        tokenUsage = JSON.parse(String(row.token_usage));
      } catch {
        // ignore parse errors
      }
    }

    return {
      gateRunId: String(row.gate_run_id),
      assessmentId: String(row.assessment_id),
      gateType: String(row.gate_type),
      verdict: String(row.verdict) as GateVerdict,
      confidence: Number(row.confidence),
      reasoning: row.reasoning ? String(row.reasoning) : undefined,
      details: row.details ? String(row.details) : undefined,
      tokenUsage,
      model: row.model ? String(row.model) : undefined,
      promptVersion: row.prompt_version ? String(row.prompt_version) : undefined,
      reasoningEffort: row.reasoning_effort ? String(row.reasoning_effort) : undefined,
      evaluationTimeMs: row.evaluation_time_ms ? Number(row.evaluation_time_ms) : undefined,
      createdAt: String(row.created_at)
    };
  }
}
