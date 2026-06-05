# Stories 11.2 through 11.12 — Clients CRM Implementation Notes

**Status:** 11-2 through 11-11 done; 11-12 partial
**Date:** 2026-06-05
**Triggered by:** Sprint Change Proposal 2026-06-05-clients-crm-page

## Stories 11-2, 11-3, 11-4, 11-5 — Service & API Layer (DONE)

All four sub-domains (clients, files, interactions, tasks) follow the same
pattern: Zod schema in `clients.dto.ts` → repository in
`repositories/*.repository.ts` → service in `services/*.service.ts` →
API route in `routes/api/staff/clients/[...]/+server.ts`. All writes
emit a `client_crm_audit_events` row.

### Files

```
src/lib/staff-portal/clients.dto.ts                                 (249 lines)
src/lib/server/staff-portal/repositories/clients.repository.ts      (358)
src/lib/server/staff-portal/repositories/client-files.repository.ts (123)
src/lib/server/staff-portal/repositories/client-interactions.repository.ts (181)
src/lib/server/staff-portal/repositories/client-tasks.repository.ts (169)
src/lib/server/staff-portal/repositories/crm-audit.repository.ts   (79)
src/lib/server/staff-portal/services/clients.service.ts             (156)
src/lib/server/staff-portal/services/client-files.service.ts        (185)
src/lib/server/staff-portal/services/client-interactions.service.ts  (122)
src/lib/server/staff-portal/services/client-tasks.service.ts        (114)
```

## Story 11-3 — Files (DONE)

R2 layout: `clients/{clientId}/{fileId}-{safeName}`. Mime allowlist:
images, PDF, text, audio, video, zip, Office. Size cap 10 MB. Upload
and download are streamed. Multi-file delete with explicit `confirm: true`
in the request body. R2 key is stripped from the API response.

## Story 11-4 — Interactions (DONE)

Types: phone, email, meeting, work, note, status_update. Filters: type,
staff, from, to. Manual entry. PATCH for edit, DELETE for removal.
Returns up to 500 most recent per request.

## Story 11-5 — Tasks (DONE)

Types: task, appointment. Statuses: open, in_progress, completed,
cancelled. Priorities: low, normal, high, urgent. PATCH auto-sets
`completed_at` on completion and clears it on reopen.

## Stories 11-6, 11-7, 11-8, 11-9, 11-10, 11-11 — UI (DONE)

```
src/routes/staff/clients/+page.svelte              (525 lines)  — List view
src/routes/staff/clients/new/+page.svelte          (335 lines)  — New client
src/routes/staff/clients/[clientId]/+page.svelte   (1599 lines) — Record view
src/routes/staff/+layout.svelte                   (1 line add) — Nav link
```

Section 1 (Company & Demographics): 16+ fields, full create / save /
cancel. Reverts on cancel. Status pill, breadcrumb, header.

Section 2 (Files): table view, multi-select, upload form with category
and description, confirmation modal for multi-delete, view links to the
download endpoint, empty state.

Section 3 (Interactions): chronological list, add form (type, when,
summary), type filter, per-row delete with confirm. Empty state.

Section 4 (Tasks & Appointments): list with checkbox-complete,
reschedule inline (datetime-local), priority badges, struck-through
visual for completed items. Empty state.

## Story 11-12 — Integration (PARTIAL)

Done:
- `Clients` link added to staff top nav (visible to staff + admin)
- `/staff/clients/+page.svelte` is the canonical clients list

Deferred to a follow-up story (no scope in this commit):
- Bidirectional link between existing `ClientProfile` (read-only
  assessment view) and the new CRM record. Requires a server-side
  mapping from `assessmentId` → `clientId`, which doesn't exist in
  the current data model.
- "Recent interactions / overdue tasks" surfacing on the Command
  Center (called out as future work in the original spec).

These are intentional omissions: the spec asks for the new surface to
be coherent with the existing one, not for the existing one to be
retro-fitted to the new one. The clean path is to add a follow-up
story that establishes the assessment→client mapping.

## Verification

- `svelte-check`: 0 errors, 0 warnings in new files
- `npm run build`: passes
- Pre-existing 5 errors in `src/routes/staff/{reports,users/command-center}/+page.svelte` are unchanged
