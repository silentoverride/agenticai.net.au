import type { AsyncDb } from '$lib/server/db';
import {
  findStaffActionAuditEventByIdempotency,
  type StaffActionAuditEvent
} from './staff-audit.repository';

export type StaffActionIdempotencyLookup =
  | { status: 'none' }
  | { status: 'sameRequest'; event: StaffActionAuditEvent }
  | { status: 'conflict'; event: StaffActionAuditEvent };

export async function lookupStaffActionIdempotency(
  db: AsyncDb,
  input: { actorId: string; assessmentId: string; idempotencyKey: string; requestHash: string }
): Promise<StaffActionIdempotencyLookup> {
  const event = await findStaffActionAuditEventByIdempotency(db, input);
  if (!event) return { status: 'none' };
  return event.requestHash === input.requestHash
    ? { status: 'sameRequest', event }
    : { status: 'conflict', event };
}
