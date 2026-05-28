# Story 9.3: Pretty-But-Wrong Detection (OFEWG-012)

Status: ready-for-dev

## Story

As a pipeline quality engineer,
I want the report-review gate to catch unsupported claims and untraceable assertions,
So that confident-sounding but evidence-free prose does not reach clients.

**Requirements sourced from:** OFEWG-012 Pretty-But-Wrong Detector (`docs/agentic-workflows/office-files-evidence-workflow-guide/ofewg-012-v1-pretty-but-wrong-detector.md`)

**Important:** The PBW detection prompt was pre-built in `pbw-detector.ts` and PBW patterns (P1-P8) are already integrated into the report-review gate via Epic 7. This story focuses on wiring the standalone PBW detector as an optional post-review gate, adding structured OFEWG-012 findings output, and providing test coverage.

## Acceptance Criteria

### AC1: PBW detector gate wired as optional post-review check

**Given** the report-review gate has completed (with integrated P1-P8 pattern scoring)
**When** `GATE_PBW_DETECTOR_ENABLED=true` is set
**Then** a standalone PBW detector gate runs using `pbw-detector.ts`'s `PBW_DETECTOR_SYSTEM_PROMPT`
**And** it operates as an additional, deeper check focused on specific OFEWG-012 concerns: claims without source attribution, numbers without calculation traceability, assumptions presented as facts, and persuasive prose masking insufficient evidence
**And** results are persisted via the existing `D1GateStore`

### AC2: PBW gate registered in gate definitions

**Given** the gate registry in `definitions.ts`
**When** the PBW detector gate is registered
**Then** it has: type `pbw-detector`, feature flag `GATE_PBW_DETECTOR_ENABLED`, kill switch `GATE_PBW_DETECTOR_KILL`
**And** it uses `reasoningEffort: 'medium'`
**And** it is included in `runAllGates()` after the report-review gate

### AC3: PBW detection test coverage

**Given** the PBW detector is operational
**When** tests run
**Then** unit tests verify:
  - Gate definition registered with correct feature flags
  - PBW prompt includes all 8 pattern detection instructions
  - Verdict rules: ALLOW when scores ≤2, BLOCK when ≥4, RETRY when =3, ESCALATE when multiple =3

## Tasks / Subtasks

- [ ] Task 1: Register PBW detector as a separate gate (AC: 1, 2)
  - [ ] Add `pbw-detector` gate definition in `definitions.ts` using `PBW_DETECTOR_SYSTEM_PROMPT`
  - [ ] Add to `runAllGates()` gate type list in `runner.ts`
  - [ ] Feature-gate: only runs when `GATE_PBW_DETECTOR_ENABLED=true`

- [ ] Task 2: Add PBW gate tests (AC: 3)
  - [ ] Test: gate definition registered with correct feature flags
  - [ ] Test: PBW prompt includes 8 patterns
  - [ ] Test: verdict rules (ALLOW/BLOCK/RETRY/ESCALATE)
  - [ ] Test: gate respects feature flag (disabled by default)

## Dev Notes

### Existing Implementation (from Epic 7)

The PBW detection is **substantially pre-built**:

1. **`pbw-detector.ts`**: Contains `PBW_DETECTOR_SYSTEM_PROMPT` with 8 detection patterns (Industry Misfire, Tool Worship, Scale Mismatch, Generic Platitudes, Missing Real Pain, Buzzword Padding, Automating Chaos, Never Rule Violations), scoring 1-5 per pattern, and verdict rules.

2. **`definitions.ts`**: Report-review gate already includes PBW patterns (P1-P8) and taste dimensions (T1-T7) in the unified `REPORT_REVIEW_SYSTEM_PROMPT`. The comment states "pbw-detector has been merged into report-review."

3. **Gap**: The standalone `PBW_DETECTOR_SYSTEM_PROMPT` was built but never registered as a gate definition. It's dead code in the exports. This story wires it up as an optional additional gate.

### OFEWG-012 vs Existing PBW Implementation

| OFEWG-012 Concern | Existing Coverage | Gap |
|---|---|---|
| Claims without source attribution | A0 (Evidence Traceability) in report-review | Covered |
| Numbers without calculation traceability | A2 (Internal Consistency), Taste T4 | Covered |
| Charts/graphs without backing data | Not applicable (no charts in output) | N/A |
| Assumptions presented as facts | A0b (Gap Handling), P4 (Generic Platitudes) | Covered |
| Persuasive prose masking evidence | P6 (Buzzword Padding), Taste T6 | Covered |
| Structured flagged findings | Not in current output format | Add via PBW detector gate |

### Implementation Plan

1. Register the `pbw-detector` gate in `definitions.ts` as a fourth gate type
2. Add it to the `runAllGates()` call sequence after report-review
3. Add basic test coverage
4. Gate is disabled by default (opt-in via `GATE_PBW_DETECTOR_ENABLED=true`)

### File List

Files to MODIFY:
- `src/lib/server/assessment/gate/definitions.ts` — add PBW detector gate definition
- `src/lib/server/assessment/gate/runner.ts` — add to `runAllGates()` list

Files to CREATE:
- `tests/gate/pbw-detector.test.ts` — PBW gate definition + prompt tests

Files to READ (do not modify):
- `src/lib/server/assessment/gate/pbw-detector.ts` — pre-built PBW prompt
- `docs/agentic-workflows/office-files-evidence-workflow-guide/ofewg-012-v1-pretty-but-wrong-detector.md` — source methodology

### Architecture Compliance

- Do NOT duplicate PBW detection — reuse existing `PBW_DETECTOR_SYSTEM_PROMPT`
- Do NOT change report-review gate's integrated PBW patterns
- PBW detector is opt-in, not enabled by default
- Uses existing `D1GateStore` for persistence
- Follows existing gate architecture (definitions → runner → store)

### Testing Requirements

- Gate definition: type, name, feature flag, kill switch, reasoning effort
- PBW prompt includes all 8 detection patterns
- Verdict rules: ALLOW (≤2), BLOCK (≥4), RETRY (=3), ESCALATE (multiple =3)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
