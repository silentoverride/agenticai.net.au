# Story 2a.1: Stripe Checkout Payment Integration

## Status

**ID:** 2a-1
**Epic:** Epic 2a
**Status:** backlog
**Priority:** (TBD)

---

## Story

As a paying customer, I want to complete payment via Stripe Checkout so that my assessment is queued after successful payment.

---

## Acceptance Criteria

- Stripe Checkout session created server-side when user confirms assessment
- Checkout session includes: price ID, customer email, success/cancel URLs, metadata (sessionId, assessmentId)
- Stripe webhook endpoint (`/api/stripe/webhook`) handles `checkout.session.completed` event
- On successful payment: update D1 assessment order status to paid, queue the assessment for pipeline processing
- Webhook validates Stripe signature with `WEBHOOK_SECRET`
- NFR17: webhook handler is non-blocking and returns 200 immediately

---

## FR / NFR / UX-DR References

- **FRs:** FR7, FR8
- **NFRs:** NFR17, NFR18
- **UX-DRs:** (none)

---

## Dependencies

0-2

---

## Tasks / Subtasks

1. Stripe Checkout Payment Integration implementation
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
