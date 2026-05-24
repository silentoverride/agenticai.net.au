# Code Context

## Files Retrieved
1. `src/lib/server/db.ts` (lines 52-151, 320-363) - local SQLite schema and DB row types for users/receipts/transcripts/reports/pipeline status.
2. `src/lib/server/db/schema.ts` (lines 1-84) - Drizzle schema mirror for core portal tables.
3. `migrations/0002_add_intake_progress.sql` (lines 1-17) - Annie intake resume/progress table.
4. `migrations/0011_rebuild_report_pipeline_foreign_keys.sql` (lines 80-126) - current D1 `pipeline_status` status CHECK and report/transcript FKs.
5. `migrations/0013_add_gate_metadata.sql` (lines 1-39) - `assessment_gates` model for gate findings.
6. `migrations/0014_add_human_assist_reviews.sql` (lines 1-27) - human assist review/escalation table.
7. `migrations/0015_add_assessment_orders.sql` (lines 1-30) - proposed immutable assessment order/audit table.
8. `src/lib/server/portal.ts` (lines 1-220, 290-360) - user/report/receipt linking and report lookup logic.
9. `src/lib/types.ts` (lines 1-46) - client-safe portal DTOs.
10. `src/lib/server/assessment/types.ts` (lines 1-54, 191-319, 349-430) - assessment job, async states, order/briefing/gate/result/analysis types.
11. `src/lib/server/assessment/report-store-r2.ts` (lines 1-150) - R2 report artifact persistence and lookup.
12. `src/lib/server/assessment/report-store.ts` (lines 1-91) - local filesystem report persistence fallback.
13. `src/lib/server/assessment/pipeline.ts` (lines 108-176, 209-260, 270-335) - report save/link/email stages and gate checkpoints.
14. `src/lib/server/assessment/pipeline-store.ts` (lines 1-31) and `pipeline-status-db.ts` (lines 1-120) - D1/in-memory pipeline status persistence.
15. `src/lib/server/assessment/gate/types.ts` (lines 1-170), `gate-store.ts` (lines 1-173), `gate/runner.ts` (lines 1-260), `gate/definitions.ts` (lines 1-140), `gate/gate-mode.ts` (lines 1-80) - gate definitions, verdict policy, persistence, modes.
16. `src/lib/server/assessment/human-assist/store.ts` (lines 1-224) - D1-backed human assist queue and review actions.
17. `src/routes/api/portal/reports/+server.ts` (lines 1-82), `src/routes/api/portal/reports/[id]/+server.ts` (lines 1-98), `src/routes/api/portal/assessments/+server.ts` (lines 1-49), `src/routes/api/portal/user/+server.ts` (lines 1-56), `src/routes/api/portal/receipts/+server.ts` (lines 1-31) - client portal API entry points.
18. `src/routes/api/pipeline-status/[session_id]/+server.ts` (lines 1-43) - public-ish pipeline polling endpoint.
19. `src/lib/server/operator-auth.ts` (lines 1-31), `src/hooks.server.ts` (lines 1-39) - operator role enforcement helper and Clerk hook.
20. `src/routes/api/operator/gates/+server.ts` (lines 1-96), `src/routes/api/operator/dashboard/+server.ts` (lines 1-122), `src/routes/api/operator/cost-dashboard/+server.ts` (lines 1-180), `src/routes/api/operator/calibration/run/+server.ts` (lines 1-81), `src/routes/api/operator/human-assist/+server.ts` (lines 1-74), `src/routes/api/operator/human-assist/[id]/+server.ts` (lines 1-32), `src/routes/api/operator/human-assist/[id]/review/+server.ts` (lines 1-59), `src/routes/operator/gates/+page.server.ts` (lines 1-7), `src/routes/api/portal/access/+server.ts` (lines 1-65) - operator/admin APIs and route protection.
21. `src/lib/server/assessment/intake-store-r2.ts` (lines 1-125), `src/routes/api/assessment/checkout/+server.ts` (lines 1-125), `src/routes/api/assessment/queue/+server.ts` (lines 1-76), `src/routes/api/stripe/webhook/+server.ts` (lines 220-364), `src/lib/server/assessment/retell-job.ts` (lines 83-185) - intake, payment, raw audit preservation, and queueing flow.
22. `src/lib/components/CalendlyButton.svelte` (lines 1-48), `src/routes/portal/[user_id]/+page.svelte` (lines 190-204), `src/routes/portal/[user_id]/reports/[report_id]/+page.svelte` (lines 50-64), `src/lib/server/email-templates.ts` (lines 185-273) - booking/follow-up CTA surfaces.
23. `src/lib/server/assessment/schema-contract.md` (lines 45-84) - intended future schema areas for source artifacts, operator actions, and follow-ups.

## Key Code

- Core data model today is `users`, `receipts`, `transcripts`, `reports`, `pipeline_status`, plus `processed_events`; `reports` only stores metadata (`user_id`, `receipt_id`, `call_id`, `session_id`, `r2_key`, `deck_url`, `title`, `company`) while report content lives in R2/local files.
- `PortalReport`/`PortalReportDetail` expose the same metadata plus optional `analysis`; no report version, staff notes, review status, meeting, task, or audit DTOs exist yet.
- Report artifacts:
  - R2 keys: `reports/{reportId}/analysis.json`, `reports/{reportId}/meta.json`, `reports/{reportId}/transcript.txt`.
  - Local fallback: `app_data/reports/{id}/analysis.json`, `report.md`, `transcript.txt`, `meta.json`.
- Gate findings:
  - `assessment_gates` records `gate_run_id`, `assessment_id`, `gate_type`, `verdict`, `confidence`, `reasoning`, `details`, `token_usage`, `model`, `prompt_version`, `reasoning_effort`, `evaluation_time_ms`, `created_at`.
  - Gate policy maps verdicts to `approve|retry|block|escalate`; default mode is `shadow`, so block/escalate are logged but treated as approve unless `GATE_MODE=blocking`.
- Human assist:
  - `human_assist_reviews` records review status (`pending|in_review|approved|rejected|edited`), `operator_id`, notes, edited content, and timestamps.
  - Store joins `human_assist_reviews` to `pipeline_status`, `assessment_gates`, and `intake_progress`; review actions update `pipeline_status` to `ready` or `failed`.
- Intake/follow-up data:
  - Guided intake follow-up answers are embedded in `intake_progress.answers_json`, Stripe metadata preview, queue transcript text, and R2 raw intake objects.
  - Retell jobs expose `openQuestionsForFollowUp`, but there is no persistent follow-up request/task table.
- Bookings/meetings:
  - Existing implementation is Calendly-only UI/email CTA using `PUBLIC_CALENDLY_URL`; no booking/meeting model, webhook, route, or stored appointment state found.
- Audit trail:
  - Raw intake is preserved to R2 at `assessments/{sessionId}/transcript.json` and `meta.json`; stage artifacts can be saved under `assessments/{sessionId}/{stage}-{timestamp}.json`.
  - `assessment_orders` migration exists as an immutable order/audit table, but code search found no runtime reads/writes.
  - `processed_events` tracks Stripe webhook idempotency; no generic audit log/operator action table found.

## Architecture

- Payment/intake flow: Annie chat or Retell call builds a transcript, Stripe webhook sets `pipeline_status=queued`, saves raw intake to R2, then enqueues `AssessmentReportJob`.
- Pipeline flow: `runReportPipeline()` runs tool research, three gate checkpoints, LLM analysis, saves report artifacts, upserts report metadata, optionally links to an existing user by Stripe email, and sends report-ready email.
- Portal flow: authenticated user APIs call `requirePortalAuth()`, sync/upsert `users`, auto-link orphan reports/receipts by email, then return reports/receipts/user data. Report detail lazy-links from R2 and returns analysis.
- Operator flow: operator pages are client-driven and fetch `/api/operator/*`; `operator-auth.ts` authorizes roles `operator` and `admin` from `users.role`.

## Start Here

Open `src/lib/server/db.ts` and `migrations/0013_add_gate_metadata.sql` first: they define the current persisted portal/report/pipeline tables and the only existing staff-review-adjacent data model. Then inspect `src/routes/api/operator/*` for route coverage and auth gaps.

## Concise Findings / Risks

- Reports are well-covered as metadata + R2/local artifacts; no DB-backed report sections, versions, staff annotations, QA status, or report audit history.
- Gate findings are persisted in `assessment_gates`; operator gates API can filter/paginate them.
- Escalations are only partially wired: human assist tables/store/routes exist, but `runGateCheckpoint()` does not create `human_assist_reviews` automatically when a gate returns `human_assist`/`escalate`.
- Follow-ups/tasks are not modeled beyond intake follow-up answers and Retell `openQuestionsForFollowUp`; no task assignment/status/due-date table or route found.
- Meetings/bookings are Calendly links only; no persisted booking/meeting entities or staff scheduling APIs found.
- Audit trail is fragmented: R2 raw intake + Stripe processed events + unused `assessment_orders`; no unified audit trail or operator action log.
- Operator/admin route protection is inconsistent: `/api/operator/gates` and `/operator/gates/+page.server.ts` call `requireOperator()`, but dashboard, cost-dashboard, calibration, and human-assist APIs do not. Clerk hook wraps non-public routes but does not itself enforce operator role.
- `src/routes/api/portal/access/+server.ts` appears suspect: it calls `resolveUser()` then passes the resolved user object to `requireOperator()`, whose signature expects `locals.auth()`; likely broken or type-invalid.
- `pipeline_status` schema CHECK allows legacy statuses (`pending`, `queued`, `pending_payment`, `running_*`, `completed`, `error`, `retry`), while newer code queries/sets `ready`, `failed`, `human_assist`, `generating`, `delayed`, `delivered`; human assist setting `ready`/`failed` may violate current D1 constraints.
- Local `initSchema()` in `src/lib/server/db.ts` does not create `assessment_gates`, `human_assist_reviews`, or `assessment_orders`; local/operator testing may require migrations rather than init-only DB.
