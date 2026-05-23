# Schema Contract & Migration Numbering Convention

> Authoritative reference for D1 migration numbering and table schema responsibilities.
> Created: Story 0.2 (Shared Schema Contracts & Assessment Data Model)

## Migration Numbering Convention

Migrations are numbered sequentially within reserved ranges per epic. This prevents merge conflicts when multiple epics create migrations concurrently.

### Reserved Ranges

| Range | Epic | Purpose |
|-------|------|---------|
| `0001`–`0009` | Portal / Epic 1 | Users, receipts, transcripts, reports, pipeline_status, intake sessions, business summary versions |
| `0010`–`0019` | Pipeline / Epic 2a | Assessment orders, gate metadata, source artifacts, stage tracking |
| `0020`–`0029` | Gate / Epic 2b | Gate mode config, calibration, operator actions, drift tracking, prompt versions |
| `0030`–`0039` | Portal / Epic 3 | Notifications, follow-ups, portal extensions |
| `0040+` | Future | Unreserved — first-come, first-served |

### Existing Migrations

| # | File | Epic | Status |
|---|------|------|--------|
| `0001` | `init.sql` | Epic 1 | Committed |
| `0013` | `add_gate_metadata.sql` | Epic 2a | Committed (early per policy) |

### Rules

1. **Create migrations in the correct range.** Epic 2a stories use `0010`–`0019`.
2. **Do not reuse skipped numbers.** If a range has gaps, leave them — they are reserved.
3. **Do not exceed your range.** If you exhaust your range, negotiate an extension.
4. **Migrations are immutable.** Never modify a committed migration. Create a new one.

## Table Schema Ownership

### Epic 1 (Portal & Intake)

| Table | File | Owner |
|-------|------|-------|
| `users` | `migrations/0001_init.sql` | Portal |
| `receipts` | `migrations/0001_init.sql` | Payment |
| `transcripts` | `migrations/0001_init.sql` | Retell |
| `reports` | `migrations/0001_init.sql` | Pipeline |
| `pipeline_status` | `migrations/0001_init.sql` | Pipeline |

### Epic 2a (Pipeline & Gate)

| Table | Migration | Owner |
|-------|-----------|-------|
| `assessment_orders` | `TBD (0010+)` | Pipeline |
| `assessment_gates` | `0013_add_gate_metadata.sql` | Gate |
| `pipeline_stage_tracking` | `TBD (0011+)` | Pipeline |
| `source_artifacts` | `TBD (0012+)` | Pipeline |

### Epic 2b (Gate Calibration)

| Table | Migration | Owner |
|-------|-----------|-------|
| `gate_mode_config` | `TBD (0020+)` | Gate |
| `gate_mode_history` | `TBD (0021+)` | Gate |
| `gate_prompt_versions` | `TBD (0022+)` | Gate |
| `gate_drift_alerts` | `TBD (0023+)` | Gate |
| `gate_token_breakdown` | `TBD (0024+)` | Gate |
| `human_assist_queue` | `TBD (0025+)` | Operator |

### Epic 3 (Portal Extensions)

| Table | Migration | Owner |
|-------|-----------|-------|
| `notifications` | `TBD (0030+)` | Portal |
| `followup_requests` | `TBD (0031+)` | Portal |

## D1 Schema Agreement

The following schema design principles are agreed (no migrations executed beyond `0013`):

1. **Assessment Orders** (`assessment_orders`): Links Stripe session → Business Summary version → pipeline execution → final briefing. References `processed_events` for idempotency.
2. **Pipeline Stage Tracking** (`pipeline_stage_tracking`): Records each stage execution per assessment order. Enables status views and operator debugging.
3. **Gate Metadata** (`assessment_gates`): Records each gate run with verdict, confidence, token usage, model, prompt version (migration 0013).
4. **Source Artifacts** (`source_artifacts`): Stores references to R2 artifacts (transcripts, interim results, final briefings).
5. **Human Assist Queue** (`human_assist_queue`): Operator queue for assessments flagged for human review.

## Shared Type References

- Async states defined in `src/lib/server/assessment/types.ts` (`ASYNC_STATES`, `AsyncState`)
- Empty/edge states: `ContentState`, `SurfaceState`, `SURFACE_STATES`
- Data models: `AssessmentOrder`, `AssessmentBriefing`, `PipelineStage`, `GateVerdict`
- These types are shared between the Pages Functions app and the Worker via `src/lib/server/assessment/types.ts`
- Worker stages use their own `workers/stages/types.ts` for message-level types
