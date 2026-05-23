# Story 2a.2: Payment Intake Reconciliation & Idempotency

## Status

**ID:** 2a-2
**Epic:** Epic 2a
**Status:** backlog
**Priority:** (TBD)

---

## Story

As a platform engineer, I want idempotent payment reconciliation so that duplicate webhooks or retries don't create duplicate orders.

---

## Acceptance Criteria

- Stripe webhook idempotency key used to prevent duplicate processing
- Payment reconciliation updates D1 assessment status: pending → paid → queued
- Failed payment webhooks (charge.failed, checkout.session.expired) logged and set order status to failed
- NFR8: payment processing completes within 5 seconds end-to-end
- Idempotency guarantee: replaying the same webhook event produces exactly one state transition

---

## FR / NFR / UX-DR References

- **FRs:** FR8, FR13
- **NFRs:** NFR8, NFR18
- **UX-DRs:** (none)

---

## Dependencies

2a-1

---

## Tasks / Subtasks

1. Payment Intake Reconciliation & Idempotency implementation
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
