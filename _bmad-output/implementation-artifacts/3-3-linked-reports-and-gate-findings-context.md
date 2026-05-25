# Story 3.3: Linked Reports and Gate Findings Context

Status: ready-for-dev

## Story

As an operator,
I want Client Profile access to reports and findings,
So that I can recover context without leaving the client record.

## Requirements Covered

FR9, FR10; NFR3, NFR6; UX-DR6, UX-DR19, UX-DR20

## Acceptance Criteria

1. **Given** current or historical reports exist for a client, **when** the operator opens the Client Profile, **then** current and historical reports are linked with state, artifact/version context, and safe navigation to the review workspace; and missing artifacts or conflicting records are displayed as degraded context, not silently ignored.

2. **Given** unresolved or recently resolved Gate Findings exist, **when** the profile renders the findings section, **then** it shows unresolved and recently resolved findings linked to the client's reports; and blocker, severity, confidence, and decision state are communicated with visible text and accessible names.

## Pre-conditions / Prerequisites

- Story 3.1 provides the Client Profile snapshot read model
- Epic 1 provides Staff Portal state mapping for reports and gate findings
- Epic 1 provides `getAvailableActions(...)` and brownfield mappers
- Existing `list-report-review-queue.ts` provides the report queue pattern
- Existing `assessment_gates` and `human_assist_reviews` tables provide source data
- Existing report artifacts in R2 or `reports` table provide version/artifact context

## Tasks / Subtasks

- [ ] Create linked context DTO types (AC: 1, 2)
  - [ ] Add `StaffLinkedReportDto` to `src/lib/staff-portal/dto.ts`
  - [ ] Include: `reportId`, `title`, `reportState`, `humanReviewState`, `artifactVersion`, `createdAt`, `hasArtifacts`, `degradedFields[]`, `reviewWorkspaceRoute`
  - [ ] Add `StaffLinkedGateFindingDto` to `src/lib/staff-portal/dto.ts`
  - [ ] Include: `findingId`, `type`, `verdict`, `confidence`, `severity`, `reasoning`, `details`, `flaggedSection`, `relatedIntakeEvidence`, `suggestedInspectionSteps`, `decisionState`, `linkedReportId`, `isBlocking`
  - [ ] Add `StaffLinkedContextSectionDto` containing arrays of reports and findings
  - [ ] Keep all DTOs serializable, camelCase, free of server imports

- [ ] Create `getLinkedReportContext` read model (AC: 1)
  - [ ] Create `src/lib/server/staff-portal/read-models/get-linked-report-context.ts`
  - [ ] Query reports linked to the client/assessment from existing tables
  - [ ] Map raw report/pipeline records through Staff Portal brownfield mappers to governed state
  - [ ] Include artifact/version context where available; mark as degraded where missing
  - [ ] Surface conflicting records as degraded/review-required, never silently choose a state
  - [ ] Return navigation-safe review workspace routes

- [ ] Create `getLinkedGateFindings` read model (AC: 2)
  - [ ] Create `src/lib/server/staff-portal/read-models/get-linked-gate-findings.ts`
  - [ ] Query gate findings linked to the client's reports from existing `assessment_gates`
  - [ ] Filter to unresolved and recently resolved findings only
  - [ ] Map through brownfield gate-finding mappers to governed state
  - [ ] Include blocker, severity, confidence with visible text descriptions
  - [ ] Ensure decision state is accessible via text, not colour alone

- [ ] Write comprehensive tests (AC: 1, 2)
  - [ ] Create `tests/staff-portal/read-models/get-linked-report-context.test.ts`
  - [ ] Create `tests/staff-portal/read-models/get-linked-gate-findings.test.ts`
  - [ ] Test: current+historical reports returned with correct state mapping
  - [ ] Test: missing artifacts → degraded field flag, not silent ignore
  - [ ] Test: conflicting records → degraded/review-required, not silent selection
  - [ ] Test: unresolved findings returned, recently resolved included
  - [ ] Test: blocker severity/confidence with visible text
  - [ ] Test: empty state (no reports or findings)
  - [ ] Test: DTO shape and lifecycle vocabulary consistency
  - [ ] Test: permission filtering (admin vs operator)

## Dev Notes

### Architecture Context

The linked reports and gate findings sections provide the Client Profile with context navigation to the Human Review workspace. They follow the same read-model pattern established in Epic 1.

```ts
export interface StaffLinkedReportDto {
  reportId: string;
  title: string;
  reportState: ReportState;
  humanReviewState: HumanReviewState | null;
  artifactVersion: string | null;
  createdAt: string; // ISO date
  hasArtifacts: boolean;
  degradedFields: string[];
  reviewWorkspaceRoute: string;
}

export interface StaffLinkedGateFindingDto {
  findingId: string;
  type: GateFindingType;
  verdict: GateFindingVerdict;
  confidence: number; // 0-1
  severity: 'critical' | 'high' | 'medium' | 'low' | null;
  reasoning: string;
  details: string;
  flaggedSection: string | null;
  relatedIntakeEvidence: string | null;
  suggestedInspectionSteps: string | null;
  decisionState: GateFindingDecisionState;
  linkedReportId: string;
  isBlocking: boolean;
}
```

### Degraded Data Handling

When data sources are incomplete or conflicting:
- Missing artifacts → set `degradedFields: ['artifacts']`, do not hide the report
- Conflicting pipeline/gate records → surface as `degradedFields: ['state']` with `reportState: 'review_required'`
- Partial gate finding data → include available fields, mark missing as `degradedFields`
- Never silently choose `Approved` or `completed` from conflicting data

### Scope Boundary

This story creates only the read-model/DTO layer for linked reports and gate findings. UI rendering of the linked context section on the Client Profile is covered in Story 3.5 (Client Profile Continuity Layout).

### Architecture Guardrails

- Map through Epic 1's brownfield mappers; do not reimplement status interpretation
- Use existing `assessment_gates` table; do not create new gate storage in this story
- Navigation routes must use SvelteKit's `resolveRoute` or path constants, not hardcoded strings
- Decision state communicated via text, not colour alone — use StateBadge pattern from Epic 1 presentation maps
- Non-leaking: permission-denied responses don't reveal report/finding existence metadata
- No UI rendering logic in read models — return typed DTOs

### Implementation Sequence

1. Add `StaffLinkedReportDto`, `StaffLinkedGateFindingDto`, `StaffLinkedContextSectionDto` to `src/lib/staff-portal/dto.ts`
2. Create `src/lib/server/staff-portal/read-models/get-linked-report-context.ts`
3. Create `src/lib/server/staff-portal/read-models/get-linked-gate-findings.ts`
4. Write tests in `tests/staff-portal/read-models/`
5. Run `vitest run tests/staff-portal`
6. Run `npm run check`
