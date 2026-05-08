import { z } from 'zod';

/**
 * Schema for the benchmark pipeline endpoint request body.
 */
export const PipelineBenchmarkSchema = z.object({
  transcript: z
    .string()
    .min(100, 'transcript must be at least 100 characters'),
  callId: z.string().optional(),
  sessionId: z.string().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().optional(),
  customerPhone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
});

export type PipelineBenchmarkRequest = z.infer<typeof PipelineBenchmarkSchema>;

/**
 * Schema for the Stripe webhook request body (partial — only fields used).
 */
export const StripeWebhookSchema = z.object({
  id: z.string().optional(),
  type: z.string().optional(),
  data: z.object({
    object: z.record(z.string(), z.any()).optional(),
  }).optional(),
});

export type StripeWebhookPayload = z.infer<typeof StripeWebhookSchema>;

/**
 * Schema for the Retell webhook request body.
 */
export const RetellWebhookSchema = z.object({
  event: z.string().min(1, 'event is required'),
  call: z.object({
    call_id: z.string().optional(),
    transcript: z.string().optional(),
    recording_url: z.string().optional(),
    metadata: z.record(z.string(), z.string()).optional(),
    custom_analysis_data: z.any().optional(),
  }).optional(),
});

export type RetellWebhookPayload = z.infer<typeof RetellWebhookSchema>;
