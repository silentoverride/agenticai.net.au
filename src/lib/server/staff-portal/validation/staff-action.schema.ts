import { z } from 'zod';

export const STAFF_ACTION_IDS = [
  'claimFinding',
  'resolveFinding',
  'overrideFinding',
  'escalateFinding',
  'approveReport',
  'rejectReport',
  'requestRegeneration'
] as const;

export const STAFF_TARGET_TYPES = ['report', 'gateFinding'] as const;

export const STAFF_ACTION_STATES = [
  'queued',
  'generating',
  'delayed',
  'generated',
  'escalated',
  'inReview',
  'approved',
  'rejected',
  'regenerationRequired',
  'clarificationRequired',
  'conflict',
  'unavailable',
  'open',
  'resolved',
  'overriddenWithReason',
  'escalatedFurther'
] as const;

export const staffActionRequestSchema = z.object({
  action: z.enum(STAFF_ACTION_IDS),
  targetType: z.enum(STAFF_TARGET_TYPES),
  targetId: z.string().min(1).optional(),
  idempotencyKey: z.string().min(1),
  expectedState: z.enum(STAFF_ACTION_STATES),
  expectedVersion: z.union([z.string().min(1), z.number()]).optional(),
  reasonCode: z.string().min(1).optional(),
  reason: z.string().min(1).optional(),
  auditMetadata: z.record(z.string(), z.unknown()).optional()
}).strict();

export type StaffActionRequestBody = z.infer<typeof staffActionRequestSchema>;
