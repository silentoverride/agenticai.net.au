# API Catalog (49 Endpoints)

**Generated:** 2026-05-30 (exhaustive scan)

## Assessment Flow
- `POST /api/assessment/checkout` — Stripe checkout for Annie intake
- `POST /api/assessment-transcript` — Transcript handling
- `GET/POST /api/assessment/queue` — Pipeline queue
- `POST /api/assessment/[report_id]/regenerate`

## Portal (Client)
- `/api/portal/receipts/*`
- `/api/portal/reports/*`
- `/api/portal/user`
- `/api/portal/assessments`
- `/api/portal/access`

## Staff Portal
- `/api/staff/assessments/[assessmentId]/actions`
- `/api/staff/assessments/[assessmentId]/audit-events`
- `/api/staff/assessments/[assessmentId]/follow-ups/*`

## Payments & Webhooks
- `/api/stripe/webhook`
- `/api/create-assessment-checkout`

## Voice / Retell
- `/api/create-retell-web-call`
- `/api/retell-webhook`
- `/api/send-assessment-sms`
- `/api/end-call`

## Pipeline & Internal
- `/api/pipeline-status/[session_id]`
- `/api/internal/run-pipeline`
- `/api/benchmark/pipeline`
- `/api/chat/intake`

## Test & Debug
- Multiple `/api/test/*` endpoints (emails, pipeline, etc.)

## Other
- `/api/assessment/[report_id]/regenerate`

---
*Full per-endpoint documentation (methods, payloads, auth) can be expanded on request.*
*See also: data-models.md for related tables (pipeline_status, intake_progress, transcripts)*

---
*Generated during bmad-document-project exhaustive scan*