# Data Models & Schema

**Source**: Migrations + server code analysis (exhaustive scan 2026-05-30)

## Core Tables

### users
- clerk_id (PK, TEXT)
- email, name, phone
- created_at

### user_reports
- id (PK), user_id (FK → users), report_id, stripe_session_id, deck_url, title, company, created_at
- Indexes on user_id, report_id

### receipts
- id (PK), user_id (FK), customer_email, ...

### intake_progress (Annie chat)
- id (AUTOINCREMENT), session_id (UNIQUE), answers_json, current_index, completed, created_at, updated_at
- Index on session_id

### transcripts
- call_id (PK), transcript, metadata (JSON), created_at, processed_at
- Index on created_at

### pipeline_status
- session_id (PK)
- status (ENUM: pending | queued | pending_transcript | running_llm | running_tools | running_deck | completed | error | retry)
- Additional fields for idempotency, report metadata, etc.

## Additional Migrations
- 0003: user_role
- 0004: call_id_to_pipeline_status

## Notes
- D1 primary (Cloudflare), better-sqlite3 for local dev only
- Strong use of JSON blobs for flexible fields (answers, metadata)
- Assessment + pipeline state heavily normalized around session_id / call_id

---
*Generated during bmad-document-project exhaustive scan*