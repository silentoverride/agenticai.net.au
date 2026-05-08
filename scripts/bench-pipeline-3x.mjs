#!/usr/bin/env node
/**
 * 3-trial benchmark runner for pipeline latency.
 * Runs bench-pipeline.mjs three times and reports the median.
 */

import { spawnSync } from 'child_process';

const TRIALS = 3;
const times = [];

for (let i = 0; i < TRIALS; i++) {
  console.log(`\n--- Trial ${i + 1}/${TRIALS} ---`);
  const result = spawnSync('node', ['scripts/bench-pipeline.mjs'], {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
    timeout: 300000,
    env: { ...process.env }
  });

  if (result.status !== 0) {
    console.error(result.stderr);
    process.exit(1);
  }

  console.log(result.stdout.trim());

  const match = result.stdout.match(/METRIC pipeline_ms=(\d+)/);
  if (match) {
    times.push(parseInt(match[1], 10));
  } else {
    console.error('No METRIC found in trial output');
    process.exit(1);
  }
}

times.sort((a, b) => a - b);
const median = times[1];
const min = times[0];
const max = times[2];

console.log(`\n=== 3-trial results: min=${min}ms, median=${median}ms, max=${max}ms ===`);
console.log(`METRIC pipeline_ms=${median}`);
