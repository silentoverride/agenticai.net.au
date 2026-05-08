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
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const secret = request.headers.get('x-internal-secret');
  if (!secret || secret !== env.INTERNAL_SECRET) {
    return text('Unauthorized', { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const transcript = typeof body.transcript === 'string' ? body.transcript : '';
  if (!transcript || transcript.length < 100) {
    return text('Missing or too-short transcript', { status: 400 });
  }

  const job = {
    callId: body.callId || `bench-${Date.now()}`,
    sessionId: body.sessionId || `bench-${Date.now()}`,
    transcript,
    customerName: body.customerName || 'Bench User',
    customerEmail: body.customerEmail || 'bench@example.com',
    customerPhone: body.customerPhone || '+61400000000',
    company: body.company || 'Bench Corp',
    source: body.source || 'benchmark',
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
