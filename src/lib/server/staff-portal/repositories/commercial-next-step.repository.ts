import type { AsyncDb } from '$lib/server/db';
import type { StaffCommercialNextStepDto, CommercialNextStepStatus } from '$lib/staff-portal/dto';
import { statusToDisplayState } from '../domain/commercial-next-step-states';

// ---------------------------------------------------------------------------
// Row type
// ---------------------------------------------------------------------------

interface CommercialNextStepRow {
  id: string;
  assessment_id: string;
  status: string;
  owner: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface CreateCommercialNextStepInput {
  assessmentId: string;
  status?: CommercialNextStepStatus;
  owner?: string | null;
  notes?: string | null;
}

export interface UpdateCommercialNextStepInput {
  id: string;
  status?: CommercialNextStepStatus;
  owner?: string | null;
  notes?: string | null;
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function findCommercialNextStepByAssessment(
  db: AsyncDb,
  assessmentId: string
): Promise<StaffCommercialNextStepDto | null> {
  const row = await db.queryOne<CommercialNextStepRow>(
    'SELECT * FROM commercial_next_steps WHERE assessment_id = ? ORDER BY created_at DESC LIMIT 1',
    assessmentId
  );
  return row ? mapRow(row) : null;
}

export async function findCommercialNextStepById(
  db: AsyncDb,
  id: string
): Promise<StaffCommercialNextStepDto | null> {
  const row = await db.queryOne<CommercialNextStepRow>(
    'SELECT * FROM commercial_next_steps WHERE id = ?',
    id
  );
  return row ? mapRow(row) : null;
}

export async function upsertCommercialNextStep(
  db: AsyncDb,
  input: CreateCommercialNextStepInput & { id: string }
): Promise<StaffCommercialNextStepDto> {
  // Upsert: insert or update on conflict
  await db.exec(
    `INSERT INTO commercial_next_steps (id, assessment_id, status, owner, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       status = COALESCE(?, status),
       owner = COALESCE(?, owner),
       notes = COALESCE(?, notes),
       updated_at = datetime('now')`,
    input.id,
    input.assessmentId,
    input.status ?? 'noAction',
    input.owner ?? null,
    input.notes ?? null,
    input.status ?? 'noAction',
    input.owner ?? null,
    input.notes ?? null
  );

  const row = await db.queryOne<CommercialNextStepRow>(
    'SELECT * FROM commercial_next_steps WHERE id = ?',
    input.id
  );
  if (!row) throw new Error('Inserted commercial next step was not found');
  return mapRow(row);
}

export async function updateCommercialNextStep(
  db: AsyncDb,
  input: UpdateCommercialNextStepInput
): Promise<StaffCommercialNextStepDto | null> {
  const setClauses: string[] = ['updated_at = datetime(\'now\')'];
  const params: unknown[] = [];

  const fields: [string, unknown | undefined][] = [
    ['status', input.status],
    ['owner', input.owner],
    ['notes', input.notes]
  ];

  for (const [column, value] of fields) {
    if (value !== undefined) {
      setClauses.push(`${column} = ?`);
      params.push(value);
    }
  }

  params.push(input.id);

  await db.exec(
    `UPDATE commercial_next_steps SET ${setClauses.join(', ')} WHERE id = ?`,
    ...params
  );

  const row = await db.queryOne<CommercialNextStepRow>(
    'SELECT * FROM commercial_next_steps WHERE id = ?',
    input.id
  );
  return row ? mapRow(row) : null;
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

function mapRow(row: CommercialNextStepRow): StaffCommercialNextStepDto {
  const status = row.status as CommercialNextStepStatus;
  return {
    id: row.id,
    assessmentId: row.assessment_id,
    status,
    owner: row.owner,
    notes: row.notes,
    displayState: statusToDisplayState(status, row.updated_at),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
