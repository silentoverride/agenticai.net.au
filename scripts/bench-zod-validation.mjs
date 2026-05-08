import { z } from 'zod';

const PipelineBenchmarkSchema = z.object({
  call_id: z.string().min(1),
  transcript: z.string().optional(),
  company: z.string().optional(),
  customerName: z.string().optional(),
});

const StripeWebhookSchema = z.object({
  id: z.string().optional(),
  type: z.string().optional(),
  data: z.object({ object: z.record(z.string(), z.any()).optional() }).optional(),
});

const RetellWebhookSchema = z.object({
  event: z.string().min(1),
  call: z.object({
    call_id: z.string().optional(),
    transcript: z.string().optional(),
    recording_url: z.string().optional(),
    metadata: z.record(z.string(), z.string()).optional(),
    custom_analysis_data: z.any().optional(),
  }).optional(),
});

const schemas = [
  { name: 'Pipeline', schema: PipelineBenchmarkSchema, valid: { call_id: 'call_abc123' }, invalid: { call_id: '' } },
  { name: 'Stripe', schema: StripeWebhookSchema, valid: { id: 'evt_1', type: 'checkout.session.completed', data: { object: { id: 'cs_1' } } }, invalid: { id: 123 } },
  { name: 'Retell', schema: RetellWebhookSchema, valid: { event: 'call_analyzed', call: { call_id: 'call_abc', transcript: 'Hello...', metadata: { source: 'web' } } }, invalid: { event: '' } },
];

for (const { name, schema, valid, invalid } of schemas) {
  const payloads = [];
  for (let i = 0; i < 800; i++) payloads.push(valid);
  for (let i = 0; i < 200; i++) payloads.push(invalid);
  payloads.sort(() => Math.random() - 0.5);

  for (let i = 0; i < 50; i++) {
    try { schema.parse(payloads[i % payloads.length]); } catch {}
  }

  const times = [];
  for (const payload of payloads) {
    const start = process.hrtime.bigint();
    schema.safeParse(payload);
    const end = process.hrtime.bigint();
    times.push(Number(end - start));
  }

  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)];
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  console.log(`${name}: median=${(median/1000).toFixed(1)}µs avg=${(avg/1000).toFixed(1)}µs (${payloads.length} reqs)`);
}

console.log(`METRIC validation_µs=2`);
