# Story 11.1: Clients Data Model and Migration

**Status:** done
**Date:** 2026-06-05
**Triggered by:** Sprint Change Proposal 2026-06-05-clients-crm-page

## What was built

`migrations/0025_clients_crm.sql` creates 5 tables:

- `clients` — id, clerk_user_id (FK→users), company_name, trading_name, primary_contact_name, job_title, email, phone, secondary_phone, website, billing_address, shipping_address, tax_id, industry, company_size, lead_source, assigned_staff_id, status, tags (JSON), custom_fields (JSON), created_at, updated_at. Indexes on company_name, email, status, assigned_staff_id, clerk_user_id, created_at.
- `client_files` — id, client_id (FK→clients CASCADE), file_name, file_type, category, size_bytes, r2_key, description, uploaded_by, uploaded_at. Indexes on client_id, category, uploaded_at.
- `client_interactions` — id, client_id (FK CASCADE), type, staff_id, summary, occurred_at, linked_file_ids (JSON), linked_task_ids (JSON), created_at, updated_at. Indexes on client_id, type, staff_id, occurred_at.
- `client_tasks` — id, client_id (FK CASCADE), type, title, description, due_at, assigned_staff_id, status, priority, completed_at, created_by, created_at, updated_at. Indexes on client_id, type, status, due_at, assigned_staff_id.
- `client_crm_audit_events` — id, client_id (FK SET NULL on delete), target_type, target_id, actor_id, action, metadata (JSON), created_at. Indexes on client_id, target_type+target_id, actor_id, created_at.

## Verification

- Migration is idempotent (CREATE TABLE IF NOT EXISTS)
- D1 cannot apply in CI; production applies via `wrangler d1 migrations apply assessment-db`
- All FKs declared with appropriate cascade behavior
- Application-layer Zod validation enforces soft enums (D1 has no enum type)

## Follow-up

A migration-runner script is not part of this story. Run `npx wrangler d1 migrations apply assessment-db --local` for dev and the same without `--local` for production.
