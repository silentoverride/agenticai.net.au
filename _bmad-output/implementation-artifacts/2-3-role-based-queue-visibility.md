# Story 2.3: Role-Based Queue Visibility

Status: done

## Story

As an admin or operator,
I want Command Center visibility to respect my role and queue permissions,
So that staff see appropriate work without leaking restricted data.

## Requirements Covered

FR5, FR63, FR64, FR65, FR66, FR67; NFR7; UX-DR33

## Acceptance Criteria

1. **Given** an admin opens the Command Center, **when** work is loaded, **then** all operational work across staff ownership is visible; and audit-sensitive context is shown according to admin permissions.

2. **Given** an operator opens the Command Center, **when** work is loaded, **then** only work assigned to them and unassigned shared-queue work they may claim is visible; and no `reviewer`, `sales`, or `manager` role is introduced.

3. **Given** an unauthorized or unauthenticated user requests Command Center data, **when** the route or API handles the request, **then** access is denied through existing Clerk/operator auth helpers; and permission-denied responses do not leak restricted object names, counts, or metadata.

## Pre-conditions / Prerequisites

Story 2.1 implemented role filtering in `getCommandCenterItems` via the `role` parameter and SQL-level filtering. Story 2.2 implemented the CommandConsole UI. The existing `requireOperator` auth helper already returns `'admin' | 'operator'`.

This story adds:
- Route-level auth tests confirming role filtering is non-leaking
- E2E-style integration test for permission-denied paths
- Confirmation that admin sees all work and operator sees only-scoped work

## Tasks / Subtasks

- [x] Role filtering exists in read model (completed in Story 2.1)
- [ ] Write route-level integration tests (AC: 1, 2, 3)
  - [ ] Create `tests/staff-portal/routes/command-center-auth.test.ts`
  - [ ] Test: admin sees all items regardless of assignment
  - [ ] Test: operator sees only assigned + shared queue items
  - [ ] Test: unauthenticated request is denied with 401
  - [ ] Test: unauthorized role does not leak restricted data in error responses
  - [ ] Test: no `reviewer`, `sales`, or `manager` role appears in any route data

- [ ] Verify endpoint hardening (AC: 3)
  - [ ] Confirm `/operator/assessments/command-center` route applies `requireOperator` auth
  - [ ] Confirm error responses for unauthorized access contain no restricted object names, counts, or metadata
  - [ ] Confirm the existing `/operator/assessments` main page route is also hardened

## Dev Notes

### Already implemented

Role filtering is baked into the bounded SQL queries in `getCommandCenterItems`:
- Admin: no WHERE restriction — all items returned
- Operator: `AND (har.operator_id IS NULL OR har.operator_id = ?)` — assigned + unassigned shared queue

This pattern matches the existing `listReportReviewQueue` read model.

### What to test

The main gap is verifying at the route level that:
1. Unauthenticated calls return 401 without leaking data
2. Operator-scoped calls never see items assigned to other operators
3. No role strings like `'reviewer'`, `'sales'`, or `'manager'` are returned

The `requireOperator` helper already handles Clerk auth. Tests should verify error shapes are non-leaking.

## Dev Agent Record

### Agent Model Used

Claude (via pi-coding-agent)

### Debug Log References

### Completion Notes List

### File List

- `tests/staff-portal/routes/command-center-auth.test.ts` — new integration test file
