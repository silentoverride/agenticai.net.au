# Story 4.2: FollowUpEditor on Client Profile

Status: done

## Story

As an operator,
I want to create and update follow-ups from the Client Profile,
So that client commitments can be managed in context.

## Requirements Covered

FR11, FR32, FR35, FR36, FR37, FR38, FR39; NFR5; UX-DR24, UX-DR30, UX-DR39

## Acceptance Criteria

1. **Given** a permitted operator opens a Client Profile, **when** they create or edit a follow-up, **then** `FollowUpEditor` supports owner, due date, source, status, consequence, client-visible flag, notes, save, cancel, complete, defer, and reassign controls; and draft edits are visually distinct from persisted governance state.

2. **Given** the user navigates away with meaningful unsaved follow-up edits, **when** destructive navigation is attempted, **then** the UI warns before losing edits; and no audit, receipt, or Command Center state changes occur until the follow-up is saved.

3. **Given** a keyboard-only user operates the editor, **when** they edit, save, cancel, complete, defer, reassign, or recover from validation errors, **then** all actions are keyboard accessible with visible focus and deterministic tab order.

## Pre-conditions / Prerequisites

- Story 4.1 provides follow-up domain model, repository, and commit action service
- Epic 3 provides Client Profile layout with placeholder sections
- Existing Svelte 5 component patterns in `src/lib/components/staff-portal/**`
- Existing repo-owned CSS custom properties and design tokens

## Tasks / Subtasks

- [ ] Create follow-up API route
  - [ ] Create `src/routes/api/operator/assessments/[assessmentId]/follow-ups/+server.ts`
  - [ ] POST: create follow-up via `insertFollowUp` repository
  - [ ] PUT: update follow-up status via `commitFollowUpAction` service
  - [ ] GET: list follow-ups for assessment via `findFollowUpsByAssessment`
  - [ ] Apply auth/role checks
  - [ ] Validate inputs with structured error codes

- [ ] Create FollowUpEditor Svelte component
  - [ ] Create `src/lib/components/staff-portal/FollowUpEditor.svelte`
  - [ ] Owner field (text input or select)
  - [ ] Due date picker (native date input)
  - [ ] Source dropdown (client_profile, human_review, meeting_brief, etc.)
  - [ ] Status controls: complete, defer (with reason), reassign (with owner)
  - [ ] Client-visible promise toggle
  - [ ] Consequence of inaction textarea
  - [ ] Notes textarea
  - [ ] Linked object references (report, gate finding, etc.) as readonly context
  - [ ] Draft state: visual distinction from persisted state
  - [ ] Save / Cancel buttons
  - [ ] Keyboard accessible: visible focus, deterministic tab order

- [ ] Integrate FollowUpEditor into Client Profile
  - [ ] Replace placeholder section on Client Profile with live FollowUpEditor
  - [ ] Load existing follow-ups via GET API
  - [ ] Show list of existing follow-ups with state badges
  - [ ] "Add Follow-up" button opens editor
  - [ ] Edit, complete, defer, reassign controls on each follow-up
  - [ ] Wire up to commitFollowUpAction service

- [ ] Add unsaved-changes guard
  - [ ] Implement `beforeNavigate` or form dirty state detection
  - [ ] Show confirmation dialog before discarding unsaved draft edits
  - [ ] No audit/receipt/state changes until explicit save

- [ ] Write comprehensive tests
  - [ ] Create `tests/staff-portal/routes/follow-ups-api.test.ts`
  - [ ] Create Playwright or component tests for FollowUpEditor (if applicable)
  - [ ] Test: create follow-up via API
  - [ ] Test: update follow-up status via API (complete, defer, reassign)
  - [ ] Test: validation errors returned with structured codes
  - [ ] Test: follow-ups listed on Client Profile
  - [ ] Test: unsaved changes warning
  - [ ] Test: DTO shape consistency

## Dev Notes

### API Route Pattern

```ts
// POST /api/operator/assessments/[assessmentId]/follow-ups
export async function POST({ params, request, locals }) {
  const body = await request.json() as CreateFollowUpInput;
  // Validate → insert → return created follow-up DTO
}

// PUT /api/operator/assessments/[assessmentId]/follow-ups/[id]
export async function PUT({ params, request, locals }) {
  const body = await request.json() as UpdateFollowUpActionInput;
  // Validate → commitFollowUpAction → return result
}

// GET /api/operator/assessments/[assessmentId]/follow-ups
export async function GET({ params, locals }) {
  const items = await findFollowUpsByAssessment(db, assessmentId);
  return json({ items });
}
```

### Architecture Guardrails

- Use existing operator-auth helpers for role checks
- Follow the route → service → repository pattern established in Epic 1
- Draft edits are client-side only — no audit/receipt/Command Center changes until save
- Unsaved-changes guard uses SvelteKit's `beforeNavigate` or `onNavigate`
- Keyboard accessible throughout: visible focus, deterministic tab order, accessible names [Source: UX-DR39]
- Accessible error messages: validation errors associated with relevant input fields
- Test IDs on form elements and action controls for automated testing

### Implementation Sequence

1. Create API route for follow-ups CRUD
2. Create FollowUpEditor.svelte component
3. Wire FollowUpEditor into Client Profile page (replacing placeholder)
4. Add unsaved-changes guard
5. Write tests
6. Run `vitest run tests/staff-portal/`
7. Run `npm run check`
