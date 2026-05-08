#!/usr/bin/env node
/**
 * Benchmark runner: fetches a transcript from D1 and times analyzeTranscript
 * via the local dev server benchmark endpoint.
 *
 * Usage:
 *   node scripts/bench-pipeline.mjs [call_id]
 *
 * Prints: METRIC pipeline_ms=<duration>
 */

import { spawnSync } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';

const CALL_ID = process.argv[2] || 'call_372abf6cf74b835f59fddc9ac57';
const API_URL = process.env.API_URL || 'http://localhost:5173';
const SECRET = process.env.INTERNAL_SECRET;

if (!SECRET) {
  console.error('INTERNAL_SECRET env var is required');
  process.exit(1);
}

// 1. Fetch transcript from D1
console.log(`[bench] Fetching transcript for ${CALL_ID}...`);

const sql = `SELECT json_object('transcript', transcript, 'metadata', metadata) as row FROM transcripts WHERE call_id = '${CALL_ID}'`;

const wrangler = spawnSync('npx', ['wrangler', 'd1', 'execute', 'assessment-db', '--remote', '--command', sql], {
  encoding: 'utf-8',
  maxBuffer: 50 * 1024 * 1024,
  timeout: 45000
});

if (wrangler.status !== 0) {
  console.error('[bench] wrangler failed:', wrangler.stderr);
  process.exit(1);
}

// Extract JSON block from wrangler output
const data = wrangler.stdout;
const start = data.indexOf('[');
const end = data.lastIndexOf(']') + 1;
if (start === -1 || end <= start) {
  console.error('[bench] Could not find JSON block in wrangler output');
  process.exit(1);
}

let parsed;
try {
  parsed = JSON.parse(data.slice(start, end));
} catch (err) {
  console.error('[bench] JSON parse failed:', err.message);
  process.exit(1);
}

const row = parsed[0]?.results?.[0]?.row;
if (!row) {
  console.error('[bench] No rows returned');
  process.exit(1);
}

let payload;
try {
  payload = JSON.parse(row);
} catch (err) {
  console.error('[bench] Failed to parse row JSON:', err.message);
  process.exit(1);
}

const transcript = payload.transcript;
const metadata = JSON.parse(payload.metadata || '{}');

console.log(`[bench] Transcript length: ${transcript.length} chars`);

// 2. Save payload to temp file to avoid escaping issues in curl
const tmpBody = `/tmp/bench-body-${Date.now()}.json`;
writeFileSync(tmpBody, JSON.stringify({
  transcript,
  callId: CALL_ID,
  customerName: metadata.customer_name || 'Bench User',
  customerEmail: metadata.customer_email || 'bench@example.com',
  company: metadata.company || 'Bench Corp'
}), 'utf-8');

// 3. Call benchmark endpoint
console.log('[bench] Running analysis...');
const curl = spawnSync('curl', [
  '-s', '-S',
  '-H', 'Content-Type: application/json',
  '-H', `x-internal-secret: ${SECRET}`,
  '-d', `@${tmpBody}`,
  `${API_URL}/api/benchmark/pipeline`
], {
  encoding: 'utf-8',
  maxBuffer: 10 * 1024 * 1024,
  timeout: 300000
});

unlinkSync(tmpBody);

if (curl.status !== 0) {
  console.error('[bench] curl failed:', curl.stderr);
  process.exit(1);
}

let result;
try {
  result = JSON.parse(curl.stdout);
} catch (err) {
  console.error('[bench] Failed to parse response:', curl.stdout.slice(0, 500));
  process.exit(1);
}

if (result.error) {
  console.error(`[bench] Endpoint error: ${result.error}`);
  console.log('METRIC pipeline_ms=0');
  process.exit(1);
}

console.log(`[bench] Analysis completed in ${result.duration_ms}ms`);
console.log(`[bench] Result length: ${result.result_length} chars`);
console.log(`METRIC pipeline_ms=${result.duration_ms}`);
