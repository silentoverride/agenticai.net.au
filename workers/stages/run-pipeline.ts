/**
 * Stage Handler: run-pipeline
 *
 * Executes the full assessment report pipeline by POSTing the job
 * to the SvelteKit internal pipeline endpoint.
 *
 * This is the current (v1) implementation — the SvelteKit app owns
 * the pipeline logic (D1, R2, LLM calls, email). Future stages in
 * Epic 2a will decompose this into independent stage handlers that
 * run directly in the Worker.
 *
 * The SvelteKit internal endpoint is authenticated via INTERNAL_SECRET.
 */

import type { StageResult, StageJobMessage } from './types';

export interface Env {
  SELF_URL?: string;
  INTERNAL_SECRET?: string;
}

export async function runPipelineStageHandler(
  payload: Record<string, unknown>,
  env: Record<string, unknown>,
  _ctx: ExecutionContext
): Promise<StageResult> {
  const env2 = env as unknown as Env;
  const endpoint = `${env2.SELF_URL || 'https://agenticai.net.au'}/api/internal/run-pipeline`;
  const secret = env2.INTERNAL_SECRET;

  if (!secret) {
    console.error('[run-pipeline] Missing INTERNAL_SECRET env var');
    return {
      ok: false,
      stage: 'run-pipeline',
      error: 'Missing INTERNAL_SECRET env var',
      proceed: false
    };
  }

  if (!payload || !payload.sessionId) {
    console.error('[run-pipeline] Invalid payload — missing sessionId', { hasPayload: !!payload });
    return {
      ok: false,
      stage: 'run-pipeline',
      error: 'Missing sessionId in payload',
      proceed: false
    };
  }

  const sessionId = String(payload.sessionId);
  console.info(`[run-pipeline] Dispatching job to SvelteKit`, {
    sessionId,
    endpoint: endpoint.replace(/\/\/[^@]+@/, '//***@'),
    hasSecret: !!secret,
    payloadKeys: Object.keys(payload).sort()
  });

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': secret
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '(unreadable)');
      console.error(`[run-pipeline] SvelteKit returned ${response.status}`, {
        sessionId,
        body: body.slice(0, 500)
      });
      return {
        ok: false,
        stage: 'run-pipeline',
        error: `SvelteKit returned HTTP ${response.status}: ${body.slice(0, 200)}`,
        proceed: response.status >= 500 // retry on 5xx
      };
    }

    const result = await response.json<{ ok: boolean; result?: Record<string, unknown> }>();
    console.info(`[run-pipeline] SvelteKit pipeline completed`, { sessionId, resultOk: result.ok });
    return {
      ok: true,
      stage: 'run-pipeline',
      data: result.result || { ok: true },
      proceed: true
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[run-pipeline] Fetch to SvelteKit failed`, { sessionId, error: message });
    return {
      ok: false,
      stage: 'run-pipeline',
      error: message,
      proceed: false
    };
  }
}
