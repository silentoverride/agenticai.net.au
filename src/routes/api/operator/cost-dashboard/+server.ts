import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { requireOperator } from '$lib/server/operator-auth';

/**
 * Default cost rates per model (USD per 1M tokens).
 * These can be overridden by env vars COST_INPUT_RATE and COST_OUTPUT_RATE.
 */
const MODEL_INPUT_RATES: Record<string, number> = {
  'gpt-4.1-mini': 0.15,
  'gpt-4o-mini': 0.15,
  'gpt-4.1': 2.0,
  'gpt-4o': 2.5,
  'o3-mini': 1.10,
  default: 0.15
};

const MODEL_OUTPUT_RATES: Record<string, number> = {
  'gpt-4.1-mini': 0.60,
  'gpt-4o-mini': 0.60,
  'gpt-4.1': 8.0,
  'gpt-4o': 10.0,
  'o3-mini': 4.40,
  default: 0.60
};

function getInputRate(model: string | null | undefined): number {
  return MODEL_INPUT_RATES[model || 'default'] || MODEL_INPUT_RATES.default;
}

function getOutputRate(model: string | null | undefined): number {
  return MODEL_OUTPUT_RATES[model || 'default'] || MODEL_OUTPUT_RATES.default;
}

function calcCost(tokens: string | null | undefined, model: string | null | undefined): { input: number; output: number; total: number } {
  if (!tokens) return { input: 0, output: 0, total: 0 };
  try {
    const parsed = typeof tokens === 'string' ? JSON.parse(tokens) : tokens;
    const inputRate = getInputRate(model);
    const outputRate = getOutputRate(model);
    const promptTokens = parsed.promptTokens || 0;
    const completionTokens = parsed.completionTokens || 0;
    const inputCost = (promptTokens / 1_000_000) * inputRate;
    const outputCost = (completionTokens / 1_000_000) * outputRate;
    return { input: inputCost, output: outputCost, total: inputCost + outputCost };
  } catch {
    return { input: 0, output: 0, total: 0 };
  }
}

/**
 * GET /api/operator/cost-dashboard
 *
 * Returns cost and token usage analytics for the operator cost dashboard.
 * Query params: period=today|week|month (default: week)
 */
export async function GET(event: RequestEvent) {
  try {
    const env = event.platform?.env as Record<string, unknown> | undefined;
    const db = env?.assessment_db as D1Database | undefined;

    // Require operator/admin role
    await requireOperator(event.locals, db);

    if (!db) {
      return json({ success: false, error: 'D1 binding not available' });
    }

    const period = event.url.searchParams.get('period') || 'week';
    const dateFilter = period === 'today' ? "date('now')"
      : period === 'month' ? "date('now', '-30 days')"
      : "date('now', '-7 days')";

    // Run all queries in parallel
    const [costByPeriod, costByGate, avgCost, tokenSummary, promptVersions, versionComparison, volumeStats] = await Promise.all([
      // Cost by time period (daily aggregation)
      db.prepare(`
        SELECT
          date(created_at) as day,
          COUNT(*) as evaluations,
          SUM(CASE WHEN token_usage IS NOT NULL AND token_usage != '' THEN 1 ELSE 0 END) as with_tokens
        FROM assessment_gates
        WHERE date(created_at) >= ${dateFilter}
        GROUP BY date(created_at)
        ORDER BY day
      `).all(),

      // Cost by gate type
      db.prepare(`
        SELECT
          gate_type,
          COUNT(*) as evaluations,
          SUM(CASE WHEN token_usage IS NOT NULL AND token_usage != '' THEN 1 ELSE 0 END) as with_tokens
        FROM assessment_gates
        WHERE date(created_at) >= ${dateFilter}
        GROUP BY gate_type
        ORDER BY gate_type
      `).all(),

      // Average cost per assessment
      db.prepare(`
        SELECT
          assessment_id,
          COUNT(*) as gate_count,
          SUM(CASE WHEN token_usage IS NOT NULL AND token_usage != '' THEN 1 ELSE 0 END) as with_tokens
        FROM assessment_gates
        WHERE date(created_at) >= ${dateFilter}
        GROUP BY assessment_id
      `).all(),

      // Token summary
      db.prepare(`
        SELECT
          model,
          token_usage,
          prompt_version as promptVersion,
          reasoning_effort as reasoningEffort
        FROM assessment_gates
        WHERE date(created_at) >= ${dateFilter}
        AND token_usage IS NOT NULL AND token_usage != ''
        ORDER BY created_at DESC
      `).all(),

      // Distinct prompt versions
      db.prepare(`
        SELECT DISTINCT prompt_version, model, reasoning_effort
        FROM assessment_gates
        WHERE prompt_version IS NOT NULL
        ORDER BY prompt_version
      `).all(),

      // Verdict distribution per prompt version
      db.prepare(`
        SELECT
          prompt_version,
          verdict,
          COUNT(*) as count
        FROM assessment_gates
        WHERE prompt_version IS NOT NULL
        AND date(created_at) >= ${dateFilter}
        GROUP BY prompt_version, verdict
        ORDER BY prompt_version, verdict
      `).all(),

      // Volume statistics for cost projection
      db.prepare(`
        SELECT
          COUNT(*) as total_gates,
          COUNT(DISTINCT assessment_id) as total_assessments
        FROM assessment_gates
        WHERE date(created_at) >= ${dateFilter}
      `).first()
    ]);

    // Parse token data and calculate costs
    const tokenRows = tokenSummary?.results || [];
    const totalTokenData = tokenRows.map((r: Record<string, unknown>) => ({
      model: r.model as string | null,
      tokenUsage: r.token_usage as string | null,
      promptVersion: r.promptVersion as string | null,
      reasoningEffort: r.reasoningEffort as string | null
    }));

    // Calculate costs per gate type
    const costByGateRows = costByGate?.results || [];
    const gateTokenMap: Record<string, { count: number; withTokens: number }> = {};
    for (const g of costByGateRows) {
      gateTokenMap[g.gate_type as string] = {
        count: (g.evaluations as number) || 0,
        withTokens: (g.with_tokens as number) || 0
      };
    }

    // Calculate per-assessment costs
    const assessmentRows = avgCost?.results || [];
    const totalCost = totalTokenData.reduce((sum, t) => {
      const c = calcCost(t.tokenUsage, t.model);
      return sum + c.total;
    }, 0);

    const assessments = assessmentRows.length;

    // Cost by day
    const dailyRows = costByPeriod?.results || [];
    const dailyCosts = dailyRows.map((d: Record<string, unknown>) => ({
      day: d.day as string,
      evaluations: (d.evaluations as number) || 0,
      withTokens: (d.with_tokens as number) || 0
    }));

    // Version comparison data
    const versionsRows = versionComparison?.results || [];
    const versionMap: Record<string, Record<string, number>> = {};
    for (const v of versionsRows) {
      const pv = (v.prompt_version as string) || 'unknown';
      const verdict = v.verdict as string;
      const count = (v.count as number) || 0;
      if (!versionMap[pv]) versionMap[pv] = {};
      versionMap[pv][verdict] = (versionMap[pv][verdict] || 0) + count;
    }

    // Cost projection (30-day)
    let projection = { estimatedMonthlyCost: 0, estimatedMonthlyAssessments: 0 };
    if (volumeStats) {
      const days = period === 'today' ? 1 : period === 'month' ? 30 : 7;
      const dailyRate = (volumeStats.total_assessments as number || 0) / days;
      const dailyCost = totalCost / days;
      projection = {
        estimatedMonthlyCost: Math.round(dailyCost * 30 * 100) / 100,
        estimatedMonthlyAssessments: Math.round(dailyRate * 30)
      };
    }

    return json({
      success: true,
      dashboard: {
        period,
        costByDay: dailyCosts,
        costByGate: Object.entries(gateTokenMap).map(([gate, data]) => ({ gate, ...data })),
        averageCostPerAssessment: assessments > 0 ? Math.round((totalCost / assessments) * 10000) / 10000 : 0,
        totalCost: Math.round(totalCost * 10000) / 10000,
        totalEvaluations: totalTokenData.length,
        assessmentsProcessed: assessments,
        promptVersions: promptVersions?.results || [],
        versionComparison: Object.entries(versionMap).map(([version, verdicts]) => ({
          promptVersion: version,
          verdicts,
          total: Object.values(verdicts).reduce((s: number, v: number) => s + v, 0)
        })),
        costProjection: projection,
        fetchedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('[cost-dashboard:api] Failed:', err);
    return json(
      { success: false, error: err instanceof Error ? err.message : 'Dashboard query failed' },
      { status: 500 }
    );
  }
}
