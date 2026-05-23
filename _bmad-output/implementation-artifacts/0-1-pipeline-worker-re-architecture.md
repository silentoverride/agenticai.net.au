# Story 0.1: Pipeline Worker Re-architecture

## Status

**ID:** 0-1
**Epic:** Epic 0
**Status:** backlog
**Priority:** (TBD)

---

## Story

As a platform engineer, I want the pipeline execution to run inside the Queue Consumer worker so that assessments can process without Cloudflare Pages Functions 30-second CPU timeout.

---

## Acceptance Criteria

- Queue consumer dispatches messages to independent stage handlers by `stage` field
- `workers/stages/` directory contains stage handler files, each a callable function
- Existing Cloudflare Pages Functions routes are untouched
- Pipeline runs in Workers context with 15-minute CPU timeout
- NFR17: webhooks are non-blocking (fire-and-forget via outgoing worker fetch)
- Backward-compatible default stage 'run-pipeline' for existing messages without stage field
- `workers/wrangler.toml` uses `nodejs_compat_v2` and pinned compatibility_date
- Queue bindings in both wrangler.toml files refer to the same `assessment-jobs` queue

---

## FR / NFR / UX-DR References

- **FRs:** FR17
- **NFRs:** NFR17
- **UX-DRs:** (none)

---

## Dependencies

(none)

---

## Tasks / Subtasks

1. Pipeline Worker Re-architecture implementation
2. Unit and integration tests
3. Acceptance criteria verification

---

## Dev Notes

<!-- Implementation details, architecture decisions, and references go here. -->

**Project Structure Notes:**
- Story files: `_bmad-output/implementation-artifacts/`
- Source code: `src/`

**References:**
- epics.md
- sprint-status.yaml

---

## Dev Agent Record

- **Agent Model Used:** (TBD)
- **Debug Log References:** (TBD)
- **Completion Notes List:**
  - (TBD)
- **File List:**
  - (TBD)
