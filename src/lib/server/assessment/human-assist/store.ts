/**
 * Human Assist Store — D1-backed queue and review tracking for human-in-the-loop assessments.
 *
 * Created by migration 0014_add_human_assist_reviews.sql.
 */

export interface HumanAssistQueueItem {
  /** Review record ID. */
  id: string;
  /** Assessment / pipeline session ID. */
  assessmentId: string;
  /** The gate run that triggered this review. */
  gateRunId: string;
  /** Gate type that flagged the assessment. */
  gateType: string;
  /** Review status. */
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'edited';
  /** Operator who claimed/took the review. */
  operatorId?: string;
  /** Operator notes about the decision. */
  operatorNotes?: string;
  /** Edited assessment content (if operator made edits). */
  editedContent?: string;
  /** When the review was completed. */
  reviewedAt?: string;
  /** When the review was created. */
  createdAt: string;
  /** Current pipeline status. */
  pipelineStatus: string;
  /** Gate verdict that caused the flag. */
  gateVerdict: string;
  /** Confidence score from the gate evaluation. */
  gateConfidence: number;
  /** Reasoning from the gate evaluation. */
  gateReasoning?: string;
  /** The raw assessment transcript (if available). */
  transcript?: string;
  /** The assessment content / analysis (if generated). */
  analysis?: string;
}

export interface ReviewAction {
  /** approve, reject, or edit */
  action: 'approve' | 'reject' | 'edit';
  /** Operator note explaining the decision. */
  notes?: string;
  /** Edited content (required for 'edit' action). */
  editedContent?: string;
  /** Operator ID who performed the review. */
  operatorId?: string;
}

/**
 * D1-backed human assist store.
 */
export class D1HumanAssistStore {
  constructor(private db: D1Database) {}

  /**
   * Get all items in the human assist queue, ordered by creation date descending.
   * Optionally filtered by status.
   */
  async getQueue(status?: string): Promise<HumanAssistQueueItem[]> {
    let sql = `
      SELECT
        har.id,
        har.assessment_id as assessmentId,
        har.gate_run_id as gateRunId,
        har.gate_type as gateType,
        har.status,
        har.operator_id as operatorId,
        har.operator_notes as operatorNotes,
        har.edited_content as editedContent,
        har.reviewed_at as reviewedAt,
        har.created_at as createdAt,
        ps.status as pipelineStatus,
        ag.verdict as gateVerdict,
        ag.confidence as gateConfidence,
        ag.reasoning as gateReasoning
      FROM human_assist_reviews har
      LEFT JOIN pipeline_status ps ON har.assessment_id = ps.session_id
      LEFT JOIN assessment_gates ag ON har.gate_run_id = ag.gate_run_id
    `;

    const params: unknown[] = [];

    if (status) {
      sql += ` WHERE har.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY har.created_at DESC LIMIT 50`;

    const result = await this.db.prepare(sql).bind(...params).all<HumanAssistQueueItem>();
    return result.results || [];
  }

  /**
   * Get a single review item with full details.
   */
  async getReviewDetails(reviewId: string): Promise<HumanAssistQueueItem | null> {
    const result = await this.db.prepare(`
      SELECT
        har.id,
        har.assessment_id as assessmentId,
        har.gate_run_id as gateRunId,
        har.gate_type as gateType,
        har.status,
        har.operator_id as operatorId,
        har.operator_notes as operatorNotes,
        har.edited_content as editedContent,
        har.reviewed_at as reviewedAt,
        har.created_at as createdAt,
        ps.status as pipelineStatus,
        ag.verdict as gateVerdict,
        ag.confidence as gateConfidence,
        ag.reasoning as gateReasoning,
        ip.answers_json as transcript,
        COALESCE(ps.deck_url, ps.report_id, '') as analysis
      FROM human_assist_reviews har
      LEFT JOIN pipeline_status ps ON har.assessment_id = ps.session_id
      LEFT JOIN assessment_gates ag ON har.gate_run_id = ag.gate_run_id
      LEFT JOIN intake_progress ip ON har.assessment_id = ip.session_id
      WHERE har.id = ?
    `).bind(reviewId).first<HumanAssistQueueItem>();

    return result || null;
  }

  /**
   * Create a human assist review record.
   */
  async createReview(
    assessmentId: string,
    gateRunId: string,
    gateType: string
  ): Promise<string> {
    const id = crypto.randomUUID();
    await this.db.prepare(`
      INSERT INTO human_assist_reviews (id, assessment_id, gate_run_id, gate_type, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).bind(id, assessmentId, gateRunId, gateType).run();

    return id;
  }

  /**
   * Update pipeline status after a review action.
   */
  async performReview(reviewId: string, action: ReviewAction): Promise<void> {
    const item = await this.getReviewDetails(reviewId);
    if (!item) throw new Error(`Review not found: ${reviewId}`);

    const now = new Date().toISOString();
    const status = action.action === 'approve' ? 'approved'
      : action.action === 'reject' ? 'rejected'
      : 'edited';

    // Update the review record
    await this.db.prepare(`
      UPDATE human_assist_reviews
      SET status = ?, operator_id = ?, operator_notes = ?,
          edited_content = ?, reviewed_at = ?
      WHERE id = ?
    `).bind(
      status,
      action.operatorId || null,
      action.notes || null,
      action.editedContent || null,
      now,
      reviewId
    ).run();

    // Update pipeline status based on action
    if (action.action === 'approve') {
      await this.db.prepare(`
        UPDATE pipeline_status
        SET status = 'ready', updated_at = ?
        WHERE session_id = ?
      `).bind(now, item.assessmentId).run();
    } else if (action.action === 'reject') {
      await this.db.prepare(`
        UPDATE pipeline_status
        SET status = 'failed', error = ?, updated_at = ?
        WHERE session_id = ?
      `).bind(
        action.notes || 'Assessment rejected by operator review',
        now,
        item.assessmentId
      ).run();
    }
    // For 'edit', status stays as 'edited' — trigger a re-generation or manual delivery
  }

  /**
   * Get queue stats (counts by status).
   */
  async getQueueStats(): Promise<Record<string, number>> {
    const result = await this.db.prepare(`
      SELECT status, COUNT(*) as count
      FROM human_assist_reviews
      GROUP BY status
    `).all<{ status: string; count: number }>();

    const stats: Record<string, number> = { pending: 0, in_review: 0, approved: 0, rejected: 0, edited: 0 };
    for (const row of result.results || []) {
      stats[row.status] = row.count;
    }
    return stats;
  }

  /**
   * Claim a review for an operator (set status to in_review).
   */
  async claimReview(reviewId: string, operatorId: string): Promise<void> {
    await this.db.prepare(`
      UPDATE human_assist_reviews
      SET status = 'in_review', operator_id = ?
      WHERE id = ? AND status = 'pending'
    `).bind(operatorId, reviewId).run();
  }
}
