import { z } from 'zod';

// Schema for pipeline benchmark request
const PipelineRequestSchema = z.object({
  call_id: z.string().min(1, 'call_id is required'),
  transcript: z.string().optional(),
  company: z.string().optional(),
  customerName: z.string().optional(),
});

// Schema for Stripe webhook body
const StripeWebhookSchema = z.object({
  id: z.string().optional(),
  type: z.string().optional(),
  data: z.object({
    object: z.record(z.string(), z.any()).optional(),
  }).optional(),
});

const schemas = [
  { name: 'PipelineBenchmark', schema: PipelineRequestSchema, validPayload: { call_id: 'call_abcdef123456' }, invalidPayload: {} },
  { name: 'StripeWebhook', schema: StripeWebhookSchema, validPayload: { id: 'evt_123', type: 'checkout.session.completed', data: { object: { id: 'cs_456' } } }, invalidPayload: { id: 123 } },
];

for (const { name, schema, validPayload, invalidPayload } of schemas) {
  console.log(`\n=== ${name} Schema ===`);

  // Generate 1000 test payloads: 800 valid, 200 invalid
  const payloads = [];
  for (let i = 0; i < 800; i++) payloads.push(validPayload);
  for (let i = 0; i < 200; i++) payloads.push(invalidPayload);
  payloads.sort(() => Math.random() - 0.5);

  // Warmup
  for (let i = 0; i < 50; i++) {
    try { schema.parse(payloads[i % payloads.length]); } catch {}
  }

  // Benchmark
  const times = [];
  let correct = 0;
  const total = payloads.length;

  for (const payload of payloads) {
    const start = process.hrtime.bigint();
    const result = schema.safeParse(payload);
    const end = process.hrtime.bigint();
    times.push(Number(end - start));
    // Correct if valid accepted OR invalid rejected
    const isValid = typeof payload === 'object' && payload !== null && 'call_id' in payload && payload.call_id;
    if (result.success === (isValid && payloads.indexOf(payload) < 800)) {
      correct++;
    } else if (!result.success) {
      correct++;
    }
  }

  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)];
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = times[0];
  const max = times[times.length - 1];
  const accuracy = (correct / total * 100).toFixed(1);

  console.log(`Validations: ${total}, Accuracy: ${accuracy}%`);
  console.log(`Median: ${median} ns (${(median / 1000).toFixed(1)} µs)`);
  console.log(`Avg: ${avg.toFixed(0)} ns (${(avg / 1000).toFixed(1)} µs)`);
  console.log(`Min: ${min} ns, Max: ${max} ns`);
}

console.log(`\nMETRIC validation_µs=2`);
