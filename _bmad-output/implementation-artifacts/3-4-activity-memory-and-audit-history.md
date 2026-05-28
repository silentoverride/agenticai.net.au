# Story 3.4: Activity Memory and Audit History

Status: done

## Story

As an admin or operator,
I want operational activity and formal audit history on the Client Profile,
So that I can distinguish context memory from accountability records.

## Requirements Covered

FR14, FR59, FR60; NFR2; UX-DR23

## Acceptance Criteria

1. **Given** operational activity and Audit Events exist for a client, **when** the Client Profile renders history, **then** recent Client activity appears as operational memory and recent Audit Events appear as formal accountability records; and Activity never substitutes for required Audit Events.

2. **Given** an operator views a client profile, **when** recent audit history is displayed, **then** the audit events show actor, timestamp, event type, affected object, previous state, new state, and reason/note when applicable; and entries link to receipts or source contexts when available.

3. **Given** an admin opens the broader Audit Trail, **when** audit records are loaded, **then** broader audit activity across clients and staff actions is visible within MVP scope; and no advanced audit search, export, or timeline virtualization is introduced for MVP.

## Pre-conditions / Prerequisites

- Story 3.1 provides the Client Profile snapshot read model
- Epic 1 provides the Staff Portal audit event persistence (migration `0017_staff_portal_action_audit_events.sql`, repositories)
- Existing `client_portal_audit_events` or similar tables provide broader audit history
- Epic 1's `commitStaffAction(...)` already creates audit events for state changes
- Existing operational activity tracking (e.g., assessment state changes, pipeline events) provides source data

## Tasks / Subtasks

- [ ] Create activity and audit DTO types (AC: 1, 2, 3)
  - [ ] Add `StaffActivityEventDto` to `src/lib/staff-portal/dto.ts` for operational memory
  - [ ] Add `StaffAuditEventDto` to `src/lib/staff-portal/dto.ts` for formal accountability
  - [ ] Include in AuditEventDto: `eventId`, `actor`, `timestamp`, `eventType`, `affectedEntity`, `affectedEntityType`, `previousState`, `newState`, `reasonOrNote`, `receiptRoute`, `sourceContextRoute`
  - [ ] Include in ActivityEventDto: `activityId`, `summary`, `timestamp`, `sourceDomain`, `actor`
  - [ ] Add `StaffAuditTrailResultDto` with `events`, `total`, `hasMore`, for admin audit trail
  - [ ] Keep all DTOs serializable, camelCase, free of server imports

- [ ] Create `getClientAuditHistory` read model (AC: 1, 2)
  - [ ] Create `src/lib/server/staff-portal/read-models/get-client-audit-history.ts`
  - [ ] Query audit events for the client from `staff_portal_action_audit_events` table
  - [ ] Return recent audit events with all required fields
  - [ ] Include receipt/source context links where available
  - [ ] Filter by role: admin sees all, operator sees permitted events
  - [ ] Apply bounded query with LIMIT, no N+1

- [ ] Create `getClientActivityHistory` read model (AC: 1)
  - [ ] Create `src/lib/server/staff-portal/read-models/get-client-activity-history.ts`
  - [ ] Query operational activity from existing assessment/pipeline event sources
  - [ ] Return recent activity as operational memory (distinct from formal audit)
  - [ ] Activity never substitutes for required Audit Events
  - [ ] Apply bounded query with LIMIT

- [ ] Create admin Audit Trail route (AC: 3)
  - [ ] Create `src/routes/operator/audit/+page.server.ts` (or extend existing admin route)
  - [ ] Apply admin role check
  - [ ] Return governed audit DTOs with pagination
  - [ ] No advanced search, export, or timeline virtualization in MVP
  - [ ] Keep route thin; delegate query logic to read model

- [ ] Write comprehensive tests (AC: 1, 2, 3)
  - [ ] Create `tests/staff-portal/read-models/get-client-audit-history.test.ts`
  - [ ] Create `tests/staff-portal/read-models/get-client-activity-history.test.ts`
  - [ ] Create `tests/staff-portal/routes/audit-trail.test.ts`
  - [ ] Test: audit events returned with all required fields
  - [ ] Test: activity events distinct from audit events
  - [ ] Test: role filtering (admin sees all, operator sees permitted)
  - [ ] Test: receipt/source context links present when available
  - [ ] Test: empty state (no events), bounded queries, pagination
  - [ ] Test: DTO shape, camelCase, no server imports

## Dev Notes

### Architecture Context

This story establishes the formal separation between operational Activity (context memory) and Audit Events (accountability records).

```ts
export interface StaffAuditEventDto {
  eventId: string;
  actor: string;
  timestamp: string; // ISO date
  eventType: AuditEventType; // 'report_state_change' | 'gate_finding_decision' | 'follow_up_change' | 'meeting_brief_change' | 'commercial_change' | 'ownership_change'
  affectedEntity: string;
  affectedEntityType: 'report' | 'gate_finding' | 'follow_up' | 'meeting_brief' | 'commercial_next_step';
  previousState: string | null;
  newState: string;
  reasonOrNote: string | null;
  receiptRoute: string | null;
  sourceContextRoute: string | null;
}

export interface StaffActivityEventDto {
  activityId: string;
  summary: string; // e.g., "Report assessment completed" or "Pipeline delivery recorded"
  timestamp: string; // ISO date
  sourceDomain: 'pipeline' | 'assessment' | 'gate' | 'human_review' | 'follow_up' | 'meeting_brief' | 'commercial';
  actor: string | null;
}
```

### Audit vs Activity Separation

| Aspect | Activity (Operational Memory) | Audit (Accountability) |
|--------|------------------------------|----------------------|
| Source | Pipeline events, assessment state changes, system events | Staff Portal `staff_portal_action_audit_events` |
| Purpose | Context memory — "what happened recently" | Formal record — "who did what and why" |
| Required for lifecycle changes? | No | Yes |
| Retention | MVP: reasonable recent window | 24-month minimum |
| Can substitute for the other? | Activity never replaces Audit | Audit stands alone |

### Scope Boundary

This story creates the read-model/DTO layer for activity and audit history plus the admin audit trail route. UI rendering of the audit activity sections on the Client Profile is covered in Story 3.5 (Client Profile Continuity Layout).

The admin audit trail is a simple bounded list — no advanced search, export, CSV download, date-range filtering, timeline virtualization, or notification features for MVP.

### Architecture Guardrails

- Activity events are derived from existing assessment/pipeline sources; do not create new activity storage
- Audit events come from Epic 1's `staff_portal_action_audit_events` table only
- Activity must never substitute for audit; if a lifecycle change occurs without an audit event, it must not appear as "completed" state
- Admin audit trail uses bounded D1 queries; no N+1 aggregation
- Admin access only; operators see only client-scoped audit events they're permitted to view
- Receipt links use SvelteKit route paths from existing receipt patterns
- No advanced search, export, timeline virtualization, or notification features for MVP [Source: UX-DR43]
- Non-leaking permission-denied for restricted audit data

### Implementation Sequence

1. Add `StaffAuditEventDto`, `StaffActivityEventDto`, `StaffAuditTrailResultDto` to `src/lib/staff-portal/dto.ts`
2. Create `src/lib/server/staff-portal/read-models/get-client-audit-history.ts`
3. Create `src/lib/server/staff-portal/read-models/get-client-activity-history.ts`
4. Create `src/routes/operator/audit/+page.server.ts`
5. Write tests
6. Run `vitest run tests/staff-portal`
7. Run `npm run check`
