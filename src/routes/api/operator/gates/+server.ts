/**
 * GET /api/operator/gates
 *
 * Returns gate evaluation results with filtering and pagination.
 * Accessible only by operator role (role-based access in layout).
 *
 * Query params:
 *   gateType  — filter by gate type (optional)
 *   verdict   — filter by verdict (optional)
 *   cursor    — pagination cursor (created_at value, optional)
 *   limit     — page size, default 50, max 100
 */

import { json } from '@sveltejs/kit';
import { D1GateStore } from '$lib/server/assessment/gate/gate-store';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, platform }) => {
  const env = platform?.env as Record<string, unknown> | undefined;
  const db = env?.assessment_db as D1Database | undefined;

  if (!db) {
    return json({ success: false, error: 'D1 binding not available' }, { status: 503 });
  }

  const gateType = url.searchParams.get('gateType') || undefined;
  const verdict = url.searchParams.get('verdict') || undefined;
  const cursor = url.searchParams.get('cursor') || undefined;
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 100);

  const store = new D1GateStore(db);

  // Build the query dynamically based on filters
  let sql = 'SELECT * FROM assessment_gates WHERE 1=1';
  const bindings: unknown[] = [];

  if (gateType) {
    sql += ' AND gate_type = ?';
    bindings.push(gateType);
  }

  if (verdict) {
    sql += ' AND verdict = ?';
    bindings.push(verdict);
  }

  if (cursor) {
    sql += ' AND created_at < ?';
    bindings.push(cursor);
  }

  sql += ' ORDER BY created_at DESC LIMIT ?';
  bindings.push(limit + 1); // Fetch one extra to check for next page

  const result = await db.prepare(sql).bind(...bindings).all<Record<string, unknown>>();
  const rows = result.results || [];
  const hasMore = rows.length > limit;
  const records = rows.slice(0, limit).map(r => ({
    gateRunId: String(r.gate_run_id),
    assessmentId: String(r.assessment_id),
    gateType: String(r.gate_type),
    verdict: String(r.verdict),
    confidence: Number(r.confidence),
    reasoning: r.reasoning ? String(r.reasoning) : null,
    model: r.model ? String(r.model) : null,
    evaluationTimeMs: r.evaluation_time_ms ? Number(r.evaluation_time_ms) : null,
    createdAt: String(r.created_at)
  }));

  const nextCursor = hasMore ? records[records.length - 1]?.createdAt : undefined;

  // Get distinct gate types and verdicts for filter dropdowns
  const [gateTypesResult, verdictsResult] = await Promise.all([
    db.prepare('SELECT DISTINCT gate_type FROM assessment_gates ORDER BY gate_type').all<Record<string, unknown>>(),
    db.prepare('SELECT DISTINCT verdict FROM assessment_gates ORDER BY verdict').all<Record<string, unknown>>()
  ]);

  return json({
    success: true,
    gates: records,
    pagination: {
      count: records.length,
      hasMore,
      nextCursor,
      limit
    },
    filters: {
      gateTypes: (gateTypesResult.results || []).map(r => String(r.gate_type)),
      verdicts: (verdictsResult.results || []).map(r => String(r.verdict))
    },
    activeFilters: {
      gateType: gateType || null,
      verdict: verdict || null
    }
  });
};
