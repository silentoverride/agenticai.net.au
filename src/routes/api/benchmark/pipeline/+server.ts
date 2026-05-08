/**
 * POST /api/benchmark/pipeline
 *
 * Benchmark endpoint that times `analyzeTranscript` with a given transcript.
 * Authenticated via x-internal-secret header.
 *
 * Body: { transcript: string, customerName?: string, company?: string }
 * Response: { duration_ms: number, result_length: number, transcript_length: number }
 */

import { json, text } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { analyzeTranscript } from '$lib/server/assessment/llm-analysis';
import { PipelineBenchmarkSchema } from '$lib/server/validation';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const secret = request.headers.get('x-internal-secret');
  if (!secret || secret !== env.INTERNAL_SECRET) {
    return text('Unauthorized', { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return text('Invalid JSON', { status: 400 });
  }

  const parsed = PipelineBenchmarkSchema.safeParse(body);
  if (!parsed.success) {
    return text(parsed.error.issues[0]?.message || 'Invalid request', { status: 400 });
  }

  const { transcript, callId, sessionId, customerName, customerEmail, customerPhone, company, source } = parsed.data;

  const job = {
    callId: callId || `bench-${Date.now()}`,
    sessionId: sessionId || `bench-${Date.now()}`,
    transcript,
    customerName: customerName || 'Bench User',
    customerEmail: customerEmail || 'bench@example.com',
    customerPhone: customerPhone || '+61400000000',
    company: company || 'Bench Corp',
    source: source || 'benchmark',
    receivedAt: new Date().toISOString()
  };

  const start = performance.now();
  let result: string;

  try {
    result = await analyzeTranscript(job);
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    const message = err instanceof Error ? err.message : String(err);
    return json({ duration_ms: duration, error: message, transcript_length: transcript.length }, { status: 500 });
  }

  const duration = Math.round(performance.now() - start);

  return json({
    duration_ms: duration,
    result_length: result.length,
    transcript_length: transcript.length,
    callId: job.callId
  });
};
