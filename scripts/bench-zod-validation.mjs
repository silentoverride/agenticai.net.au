import { z } from 'zod';

// Schema for pipeline benchmark request
const PipelineRequestSchema = z.object({
  call_id: z.string().min(1, 'call_id is required'),
  transcript: z.string().optional(),
  company: z.string().optional(),
  customerName: z.string().optional(),
});

// Generate 1000 test payloads: 800 valid, 200 invalid
const payloads = [];
for (let i = 0; i < 800; i++) {
  payloads.push({ call_id: `call_${i}_abcdef123456` });
}
for (let i = 0; i < 200; i++) {
  payloads.push(
    Math.random() > 0.5
      ? { call_id: '' }
      : {}
  );
}
payloads.sort(() => Math.random() - 0.5);

// Warmup
for (let i = 0; i < 100; i++) {
  try { PipelineRequestSchema.parse(payloads[i % payloads.length]); } catch {}
}

// Benchmark
const times = [];
let correct = 0;
const total = payloads.length;

for (const payload of payloads) {
  const start = process.hrtime.bigint();
  try {
    const result = PipelineRequestSchema.parse(payload);
    if (result.call_id && result.call_id.length > 0) correct++;
  } catch {
    if (!payload.call_id || payload.call_id === '') correct++;
  }
  const end = process.hrtime.bigint();
  times.push(Number(end - start));
}

times.sort((a, b) => a - b);
const median = times[Math.floor(times.length / 2)];
const avg = times.reduce((a, b) => a + b, 0) / times.length;
const min = times[0];
const max = times[times.length - 1];
const accuracy = (correct / total * 100).toFixed(1);

console.log(`\n=== Zod Validation Baseline ===`);
console.log(`Validations: ${total}`);
console.log(`Accuracy: ${accuracy}% (${correct}/${total})`);
console.log(`Median: ${median} ns (${(median / 1000).toFixed(2)} µs)`);
console.log(`Average: ${avg.toFixed(0)} ns (${(avg / 1000).toFixed(2)} µs)`);
console.log(`Min: ${min} ns`);
console.log(`Max: ${max} ns`);
console.log(`\nMETRIC validation_µs=${(median / 1000).toFixed(0)}`);
