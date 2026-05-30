# Retrieval Contract Architecture Prompt Kit

Source blog URL: `https://promptkit.natebjones.com/20260508_639_promptkit_2`
Folder: `docs/agentic-workflows/retrieval-contract-architecture/`

## Purpose

Three engineering prompts for builders who operate agents in production and need to get their retrieval architecture right. Each prompt operationalizes the "retrieval contract" framing — define what your agent must receive before it acts, diagnose why it failed when it didn't, and formalize your architectural decisions with honest tradeoffs. Produces artifacts you paste into design docs, ADRs, and postmortems.

## How to use these prompts

For senior engineers, tech leads, and staff engineers building or operating agents that retrieve from external sources. Bring real inputs — these prompts will refuse to produce output from vague descriptions.

Prompt 1 produces a Retrieval Contract Spec for designing a new retrieval layer or diagnosing an existing one. Prompt 2 triages a production retrieval failure against seven failure modes and names the minimum fix. Prompt 3 produces a complete Architecture Decision Record for a specific stack change decision. They chain together: Prompt 1's output feeds into Prompt 3 as the contract the architecture must serve.

## Naming convention

Document IDs use the pattern `[parent-folder]-[sequence]-v1`, where `[parent-folder]` is this prompt file's immediate parent folder, the three-digit sequence preserves the prompt order within this folder, and `v1` is the initial document version. The workflow-family code `rca` is derived from the folder name `retrieval-contract-architecture`.

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `rca-001-v1-retrieval-contract-spec.md` | Retrieval Contract Spec | Seven-dimension specification (work object, retrieval units, authoritative sources, permissions, provenance, compiled context, write-back contract) with current state, target state, and gaps. |
| 002 | `rca-002-v1-retrieval-failure-triage.md` | Retrieval Failure Triage | Pattern-matches failures against seven retrieval failure modes (wrong retrieval unit, non-authoritative source, missing permissions, missing provenance, context not compiled, context overload, no retrieval required) with minimum fix and what NOT to rebuild. |
| 003 | `rca-003-v1-retrieval-stack-adr.md` | Retrieval Stack ADR | Architecture Decision Record with context, decision, positive/negative consequences, rejected alternatives with real reasons, verification plan, and rollback plan. |

## Revision guidance

When updating these prompts, increment the version number in the filename (e.g., `v1` → `v2`) and update the `Version` field in the document header. Preserve sequence numbers — they establish the intended workflow order and cross-referencing with the broader agentic workflow library.
