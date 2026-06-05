/**
 * CRM audit log repository — DB layer for `client_crm_audit_events`.
 *
 * Covers create/update/delete/upload/download on clients and their
 * sub-resources (files, interactions, tasks). Distinct from the
 * assessment-scoped `staff_action_audit_events` used by the staff
 * portal state machine.
 */

import type { AsyncDb } from '$lib/server/db';

export interface CrmAuditEvent {
  id: string;
  clientId: string | null;
  targetType: 'client' | 'client_file' | 'client_interaction' | 'client_task';
  targetId: string | null;
  actorId: string;
  action: 'create' | 'update' | 'delete' | 'upload' | 'download';
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface LogCrmAuditInput {
  id: string;
  clientId: string | null;
  targetType: CrmAuditEvent['targetType'];
  targetId: string | null;
  actorId: string;
  action: CrmAuditEvent['action'];
  metadata?: Record<string, unknown> | null;
}

export async function logCrmAudit(
  db: AsyncDb,
  input: LogCrmAuditInput
): Promise<void> {
  await db.exec(
    `INSERT INTO client_crm_audit_events (
      id, client_id, target_type, target_id, actor_id, action, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    input.id,
    input.clientId,
    input.targetType,
    input.targetId,
    input.actorId,
    input.action,
    input.metadata ? JSON.stringify(input.metadata) : null
  );
}

export async function listCrmAuditForClient(
  db: AsyncDb,
  clientId: string,
  limit = 200
): Promise<CrmAuditEvent[]> {
  const rows = await db.queryAll<{
    id: string;
    client_id: string | null;
    target_type: string;
    target_id: string | null;
    actor_id: string;
    action: string;
    metadata: string | null;
    created_at: string;
  }>(
    'SELECT * FROM client_crm_audit_events WHERE client_id = ? ORDER BY created_at DESC LIMIT ?',
    clientId, limit
  );
  return rows.map((r) => ({
    id: r.id,
    clientId: r.client_id,
    targetType: r.target_type as CrmAuditEvent['targetType'],
    targetId: r.target_id,
    actorId: r.actor_id,
    action: r.action as CrmAuditEvent['action'],
    metadata: r.metadata ? (JSON.parse(r.metadata) as Record<string, unknown>) : null,
    createdAt: r.created_at
  }));
}
