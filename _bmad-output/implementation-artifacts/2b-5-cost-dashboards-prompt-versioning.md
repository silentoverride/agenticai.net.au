# Story 2b.5: Cost Dashboards & Prompt Versioning

## Status

**ID:** 2b-5
**Epic:** Epic 2b
**Status:** backlog
**Priority:** (TBD)

---

## Story

As an operator, I want cost dashboards and prompt version tracking so that I can manage operational costs and iterate on prompts.

---

## Acceptance Criteria

- Cost dashboard: total LLM cost per day/week/month, cost breakdown by pipeline stage, average cost per assessment
- Token usage tracking: prompt tokens, completion tokens, total tokens per assessment
- Prompt version registry: each gate run records prompt_version, model, reasoning_effort
- Prompt version comparison: side-by-side view of verdict distribution for different prompt versions
- Cost projection: estimated monthly cost based on current volume and average cost per assessment

---

## FR / NFR / UX-DR References

- **FRs:** FR22, FR25, FR26
- **NFRs:** (none)
- **UX-DRs:** (none)

---

## Dependencies

2b-2

---

## Tasks / Subtasks

1. Cost Dashboards & Prompt Versioning implementation
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
