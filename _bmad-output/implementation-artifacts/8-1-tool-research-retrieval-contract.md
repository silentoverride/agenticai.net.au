# Story 8.1: Tool Research Retrieval Contract (RRC-001)

Status: done

## Story

Formal retrieval contract for the tool research phase, specifying data sources, staleness tolerances, and expected output.

**Deliverable:** `docs/tool-retrieval-contract-v1.md` (240+ lines)

## What Was Produced

The contract defines:
- **Input contract**: transcript + structured Retell metadata (role, industry, teamSize, currentTools, budgetSignal)
- **Output contract**: `RetrievalRecord[]` with 18 typed fields (name, url, category, pricing, AU availability, confidence, source provenance, budget alignment, team fit)
- **Contract guarantees**: no hallucination pass-through (confidence < 0.4 stripped), AU availability checked, structured pricing, source tracking, explicit cache freshness
- **Budget alignment**: automatic classification using budget signal bounds
- **Cache contract**: 7-day TTL, SHA-256 key derivation, explicit invalidation rules
- **Fallback contract**: no scenario causes pipeline failure — tools are enrichment, not requirement
- **Implementation roadmap**: 8-step migration path (types → refactor → pipeline → gates → remove extraction call → test)
- **Testability**: deterministic contract enables INPUT→EXPECT tests

Eliminates the redundant `extractPainPointsForToolLookup()` Perplexity call (saves ~20s latency, ~$0.03/report).
