# Sprint Change Proposal — Clients CRM Page

**Date:** 2026-06-05
**Trigger:** New requirement from product owner
**Severity:** Major — extends MVP into post-MVP scope
**Status:** Awaiting user approval

---

## 1. Issue Summary

The product owner has requested a **Clients page** inside the staff portal, comprising:

- A **Clients List** with search, sort, pagination, "New Client" button, row-level "Open" navigation
- A **Client Record** view with four sections: (1) Company and Demographic Information with full editing, (2) Files, (3) Interaction Log, (4) Tasks and Appointments

This goes **substantially beyond the current Staff Portal MVP**, which the brief and PRD scoped to a narrower surface:

> "The first useful version should not become a full CRM, sales cockpit, or governance suite. Its job is narrower and more important: make report delivery safe, visible, and accountable." (`brief-agentic-ai-staff-portal-2026-05-23/brief.md`)

> UJ-3 — *Understand a client* — Operator opens a **Client Profile** to understand current report state, follow-ups, meeting notes, Commercial Next Step, and recent activity. (PRD)

The current `ClientProfile.svelte` is a **read-only snapshot** of state derived from existing tables (`users`, `user_reports`, `assessments`, `follow_ups`, `meeting_briefs`, `commercial_next_steps`, `audit_events`). It has:

- ✅ Editable sub-panels for FollowUps, MeetingBrief, CommercialNextStep (the 3 sub-editors are already wired)
- ❌ **No company/demographic editing** — there's no `companies` table, no trading name, no tax ID, no address fields, no industry, no source-of-lead
- ❌ **No Files** — no file table, no upload pipeline, no R2 binding for client files
- ❌ **No Interaction Log** — `activity_history` exists as a read model but there's no write surface, no manual entry, no phone/email/meeting categorization
- ❌ **No Tasks and Appointments** distinct from FollowUps — follow-ups are owner-bound commitments; the spec asks for full scheduling/CRUD with priority, completion, reschedule

The product owner is **requesting new product surface area**, not refinement of the existing one.

---

## 2. Impact Analysis

### 2.1 Epic Impact

| Existing Epic | Affected? | Notes |
|---|---|---|
| Epic 1: Safe Report Review | None | |
| Epic 2: Command Center | None | (could add a "Clients" entry point later) |
| Epic 3: Client Profile Operational Memory | **Major — extended scope** | The `ClientProfile` now needs to host 4 sections of editable data, not just a read-only snapshot. Sections 1, 2, 3, 4 of the spec are entirely new. |
| Epic 4: Follow-up Commitments | Partial | Tasks/Appointments section overlaps with FollowUps; needs disambiguation (see §3.1). |
| Epic 5: Meeting Brief & Commercial Continuity | None | Meeting Brief remains scoped to upcoming meetings; does not become a general "appointment" system. |
| Epics 6–10 (Pipeline) | None | |

**Net new scope:** Files subsystem, Interaction Log subsystem, Tasks/Appointments subsystem, full Companies/Contacts CRUD.

This is **at least 4–6 weeks of work** if done properly. Doing it as a single epic would be a Major change. Doing it as a new **Epic 11: Clients CRM** with sub-stories is the cleaner decomposition.

### 2.2 Artifact Conflict

| Artifact | Conflict / Change |
|---|---|
| **PRD** (`prd-agenticai.net.au-2026-05-23/prd.md`) | None at MVP level. The PRD's MVP is "make report delivery safe." CRM is explicitly out-of-scope. The change adds a **post-MVP track** but does not invalidate the MVP. |
| **Brief** (`brief-agentic-ai-staff-portal-2026-05-23/brief.md`) | The brief explicitly warns "should not become a full CRM." This is a **strategy reversal** of the brief's first principle. The brief should be updated to acknowledge the new direction. |
| **UX Design** (`ux-design-specification.md`) | Will need an addendum covering the Clients List + Client Record view. |
| **Architecture** (`architecture.md`) | Requires: (a) new `companies` table (or extension of `users`), (b) new `client_files` table + R2 binding wiring, (c) new `client_interactions` table, (d) new `client_tasks` table (or reuse follow_ups with broader schema), (e) new CRUD service modules under `src/lib/server/staff-portal/`, (f) new API routes, (g) new staff pages. |
| **Epics** (`epics.md`) | New Epic 11: Clients CRM. New stories 11-1 through 11-N. |
| **Sprint Status** | New epic-11 status block; all stories start in `backlog`. |

### 2.3 Data Model

Current:
- `users` (clerk_id, email, name, phone, created_at)
- `user_reports` (links users to reports)
- `assessments` (loose client_id reference)

Required new tables or extensions:
1. **`clients` (or extend `users`)** — company_name, trading_name, primary_contact_name, job_title, secondary_phone, website, billing_address, shipping_address, tax_id, industry, company_size, lead_source, assigned_staff_id, status, tags, custom_demographic_fields (JSON)
2. **`client_files`** — id, client_id, file_name, file_type, category, size, uploaded_by, uploaded_at, description, r2_key
3. **`client_interactions`** — id, client_id, type (phone/email/meeting/work/note/status_update), staff_id, summary, occurred_at, linked_file_ids (JSON), linked_task_ids (JSON)
4. **`client_tasks`** — id, client_id, type (task/appointment), title, due_at, assigned_staff_id, status, priority, description, completed_at

Three are entirely new. The fourth (client_tasks) could potentially reuse `follow_ups` if we widen the type taxonomy, but the spec's requirements (priority, completion, reschedule, file linking) are richer than what follow_ups support — recommend a separate table.

### 2.4 Permissions

The existing `staff-auth.ts` model gates by **role** (admin, staff). CRM features should follow the same model:
- **List / View / Edit Clients** — both admin and staff
- **Delete Client** — admin only (with confirmation)
- **Files (upload/delete)** — both
- **Interactions / Tasks (CRUD)** — both

**External-client impact:** None. The brief is explicit: clients do not use the staff portal.

---

## 3. Detailed Change Proposals

### 3.1 New Epic 11: Clients CRM

**11-1: Companies/Contacts data model and migration**
- Add `clients` table with full demographic schema
- Add indexes: company_name, email, status, assigned_staff_id
- Add migration script
- Zod schema + types in `src/lib/staff-portal/dto.ts`
- Acceptance: migration runs cleanly on dev + prod D1; Zod schema validates sample data

**11-2: Clients repository + service layer**
- `src/lib/server/staff-portal/repositories/clients.ts` — read/write by id, list with filters
- `src/lib/server/staff-portal/services/clients.ts` — business logic (validation, audit logging, RBAC)
- Unit tests in `tests/staff-portal/clients.test.ts`
- Acceptance: CRUD ops audited; tests green

**11-3: Client files subsystem (R2-backed)**
- `client_files` table
- R2 binding wiring via `event.platform.env.ASSESSMENT_BLOBS` (reuse existing binding)
- API: `POST /api/staff/clients/:id/files` (multipart upload), `GET /api/staff/clients/:id/files`, `DELETE /api/staff/clients/:id/files/:fileId` (with confirmation)
- Server-side: validate mime type, size limit (10MB MVP), category enum, optional description
- Acceptance: upload, list, download, delete with confirmation all working; R2 keys scoped per-client

**11-4: Interaction log**
- `client_interactions` table
- API: `POST/GET/PATCH/DELETE /api/staff/clients/:id/interactions`
- Filter support: type, staff, date range
- Acceptance: chronological view, filtering, audit trail

**11-5: Tasks and appointments**
- `client_tasks` table
- API: `POST/GET/PATCH/DELETE /api/staff/clients/:id/tasks`
- Status: open / in_progress / completed / cancelled
- Reschedule: `PATCH ...` with new due_at
- Acceptance: CRUD + completion + reschedule working; visual distinction (completed vs open)

**11-6: Clients List view**
- `src/routes/staff/clients/+page.svelte`
- Search across: company_name, contact_name, email, phone, client_id, tags, status
- Sort: company_name, status, created_at, last_interaction
- Pagination: server-side, 25/page default
- "New Client" button → opens blank record form
- Row click + explicit "Open" link → navigates to record view
- Empty state: "No clients yet. Add your first."
- Acceptance: keyboard-navigable, responsive, follows design system

**11-7: Client Record view — sections shell**
- `src/routes/staff/clients/[clientId]/+page.svelte`
- Tab or anchor-based navigation between 4 sections
- Breadcrumb: Staff › Clients › {Company Name}
- Acceptance: smooth section navigation, browser back/forward respected

**11-8: Section 1 — Company and Demographic editor**
- Form with the 16+ fields from the spec
- Validation, save, cancel
- Editing controls locked to admin/staff role
- Acceptance: round-trip create / update / cancel works

**11-9: Section 2 — Files**
- Table view with select-multiple
- Upload button with category dropdown + description field
- Delete-selected with confirmation dialog
- View / download per file
- Empty state guidance
- Acceptance: upload + multi-select delete + view all working; R2-backed; sizes shown

**11-10: Section 3 — Interaction log**
- Chronological list
- "Add entry" button → inline form (type, summary, occurred_at)
- Filter by type / staff / date range
- View / edit / delete on each entry
- Acceptance: filters work, all CRUD ops work

**11-11: Section 4 — Tasks and Appointments**
- List with title, type, due date, owner, status, priority
- Create / edit / complete / reschedule / delete
- Visual distinction: completed (muted) vs open (full color)
- Empty state: "No scheduled work for this client."
- Acceptance: full CRUD, reschedule via date picker, completion toggles visual state

**11-12: Integration with Command Center + Client Profile**
- Add "Clients" entry to staff nav
- Surface overdue tasks / recent interactions on existing ClientProfile (optional)
- Acceptance: navigation is bidirectional; no broken links

### 3.2 Brief Update Required

The brief should be amended to acknowledge CRM as a post-MVP track. Recommended edit:

> ~~"The first useful version should not become a full CRM..."~~
>
> **Amended:** "The first useful version focuses on safe report delivery. Once stable, expand into a CRM-capable surface that supports full client records, file management, interaction history, and task scheduling."

### 3.3 PRD Update Required

Add a new section under the Staff Portal scope:

> **Post-MVP Track — Clients CRM**
>
> Once MVP report-review and command-center capabilities are stable, extend the Staff Portal with a full Clients CRM: list, full client record (company + demographic + files + interactions + tasks), and integration with existing surfaces.

### 3.4 UX Design Update

Add an addendum to `ux-design-specification.md` covering the new Clients List + Client Record layouts. Must follow the same design system (tokens from `src/styles.css`, primitives from `src/lib/components/ui/`).

---

## 4. Recommended Approach

**Option 1 — Direct Adjustment (NOT recommended):** Add 12 new stories to the existing epic structure. **Rejected** because the brief explicitly carved CRM out of MVP, the data model needs 4 new tables, and the work is multi-week.

**Option 2 — Rollback (NOT applicable):** No rollback needed; MVP is complete and remains valid.

**Option 3 — MVP Review (PARTIALLY applicable):** MVP itself is not changing. But the *next* track (post-MVP) needs to be formally defined. Recommended.

### Selected Approach: **Hybrid (Option 1 + Option 3)**

- **Treat the new CRM work as a new Epic 11 with 12 stories.** Add it to `sprint-status.yaml` and `epics.md`.
- **Acknowledge that the brief and PRD are being extended** with a post-MVP track. Update the brief and PRD to record this.
- **Ship incrementally, story by story**, using the existing `bmad-dev-story` workflow. The 12 stories are sequenced so the data model (11-1) lands first, then service layer (11-2), then the 4 sub-features (11-3, 11-4, 11-5), then the UI (11-6 through 11-12).

**Effort estimate:** Medium-High
- 12 stories
- 4 new database tables + 1 migration
- 4 new API surface groups (~16 endpoints)
- 2 new SvelteKit route trees (list, [id])
- 1 updated SvelteKit route tree (ClientProfile integration)
- ~5,000–8,000 lines of code (UI + services + tests)

**Risk:** Medium
- R2 file uploads have edge cases (large files, mime validation, signed URLs)
- Sorting + pagination across multiple indexed fields is non-trivial in D1
- Interaction log filtering needs careful date-range handling
- The spec's "any custom demographic fields" hint is intentionally vague — recommend JSON blob on `clients.custom_fields` and a small admin UI to define them (out of scope for MVP — flag as deferred)

**Timeline impact:** New epic in the post-MVP queue. Should not block any other work. Recommended sequencing: 11-1 → 11-2 → 11-3 → 11-4 → 11-5 → 11-6 → 11-7 → 11-8 (in parallel: 11-9, 11-10, 11-11) → 11-12.

---

## 5. Implementation Handoff

**Scope classification: Major**

The change introduces 12 new stories, 4 new database tables, 16+ new API endpoints, and 2 new route trees. This requires **Product Manager + Solution Architect** alignment on the data model and module boundaries before any Developer work begins.

**Recommended handoff sequence:**

1. **Product Manager (you, the user):** Approve this proposal. Sign off on the post-MVP direction. Confirm the 12 stories are correctly scoped.
2. **Solution Architect (Winston agent):** Review the proposed data model (4 new tables) and API surface (16+ endpoints). Flag any architectural concerns. Update `architecture.md` with the new clients domain.
3. **UX Designer (Sally/Freya agent):** Produce the UX addendum covering the Clients List + Client Record view. This can happen in parallel with architect work.
4. **Developer (Amelia agent):** Once the data model + API contracts are locked, implement story-by-story via the `bmad-dev-story` workflow.

**Success criteria:**
- All 12 stories reach `done` status
- A new client can be created end-to-end (form → DB → list)
- A new file can be uploaded, listed, and deleted
- An interaction can be logged, filtered, edited, and deleted
- A task can be created, completed, rescheduled, and deleted
- Existing MVP surfaces (ClientProfile, Command Center, Meeting Brief) still work unchanged
- `npm run build` passes
- `npm test` passes (new tests for clients repo + services)

**Handoff recipients:**
- **PM (you):** Review this proposal, approve, and request any story changes
- **Architect agent:** Data model review + architecture doc update
- **UX agent:** UX addendum
- **Developer agent:** Implementation (after architect + UX sign-off)

---

## 6. Next Steps (pending approval)

If approved, the immediate actions are:
1. Update `epics.md` with Epic 11 + 12 new stories
2. Update `sprint-status.yaml` to add `epic-11: backlog`
3. Update `brief-agentic-ai-staff-portal-2026-05-23/brief.md` to acknowledge CRM as post-MVP
4. Update `prd-agenticai.net.au-2026-05-23/prd.md` with the post-MVP track section
5. Hand off to Architect (data model + API surface) and UX (Clients List + Client Record designs)
6. Begin implementation of 11-1 once Architect approves the data model

---

**Awaiting explicit user approval before proceeding to implementation.**
