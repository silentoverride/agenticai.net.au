import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const migrationSql = readFileSync('migrations/0017_staff_portal_action_audit_events.sql', 'utf8');
const dbSource = readFileSync('src/lib/server/db.ts', 'utf8');

const requiredColumns = [
  'id',
  'assessment_id',
  'actor_id',
  'action',
  'from_state',
  'to_state',
  'reason_code',
  'reason',
  'request_hash',
  'idempotency_key',
  'created_at',
  'target_type',
  'target_id',
  'metadata_json'
];

describe('staff action audit schema', () => {
  it('defines required persisted action fields in the D1 migration', () => {
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS staff_action_audit_events');
    for (const column of requiredColumns) expect(migrationSql).toContain(column);
    expect(normalize(migrationSql)).toContain('UNIQUE(actor_id, assessment_id, idempotency_key)');
  });

  it('keeps local SQLite init in parity with the migration', () => {
    expect(dbSource).toContain('CREATE TABLE IF NOT EXISTS staff_action_audit_events');
    for (const column of requiredColumns) expect(dbSource).toContain(column);
    expect(normalize(dbSource)).toContain('UNIQUE(actor_id, assessment_id, idempotency_key)');
  });

  it('creates bounded lookup indexes for later audit timeline reads', () => {
    for (const column of ['assessment_id', 'actor_id', 'action', 'created_at']) {
      expect(migrationSql).toContain(`idx_staff_action_audit_events_${column}`);
      expect(dbSource).toContain(`idx_staff_action_audit_events_${column}`);
    }
  });
});

function normalize(value: string): string {
  return value.replace(/\s+/g, ' ');
}
