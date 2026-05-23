# Story 2a.5: Tool-Based Research Integration

## Status

**ID:** 2a-5
**Epic:** Epic 2a
**Status:** backlog
**Priority:** (TBD)

---

## Story

As a platform engineer, I want the pipeline to research real AI tools relevant to the customer's context so that recommendations reference actual products.

---

## Acceptance Criteria

- `toolResearch` stage uses Perplexity API or similar to search for AI tools matching customer's described needs
- Tool research results include: name, description, URL, pricing tier, category
- Results are cached with TTL (24 hours) to avoid duplicate API calls
- Tool data is injected into the LLM analysis prompt as supplementary context
- Graceful degradation: if tool research fails, pipeline continues with analysis using only transcript data
- Research limited to 3–5 most relevant tools to control token usage

---

## FR / NFR / UX-DR References

- **FRs:** FR10, FR11, FR12, FR14, FR21
- **NFRs:** (none)
- **UX-DRs:** (none)

---

## Dependencies

2a-4

---

## Tasks / Subtasks

1. Tool-Based Research Integration implementation
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
