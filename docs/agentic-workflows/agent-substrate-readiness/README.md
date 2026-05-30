# Agent Substrate Readiness Prompt Kit

Source blog URL: `https://promptkit.natebjones.com/20260428_cx5_promptkit_1`
Folder: `docs/agentic-workflows/agent-substrate-readiness/`

## Purpose

This kit turns the article's core diagnostic — persistent state, defined verbs, ownership, permissions, audit history — into operational prompts you can run against your tools, your organization, and your product. Three prompts, three audiences: one for evaluating any single tool, one for auditing an entire organization's substrate, and one for product builders who need to make their tool agent-operable.

## How to use these prompts

Prompt 1 (Tool Substrate Diagnostic) is the starting point. Pick any tool in your stack and score it against the five properties. Prompt 2 (Organization Substrate Audit) is for leaders mapping the full patchwork across their entire ecosystem. Prompt 3 (Product Agent-Readiness Blueprint) is for builders who want agents to operate through their product, not around it. Each is independent. Run all three in sequence for a complete picture.

## Naming convention

Document IDs use the pattern `[parent-folder]-[sequence]-v1`, where `[parent-folder]` is this prompt file's immediate parent folder, the three-digit sequence preserves the prompt order within this folder, and `v1` is the initial document version. The workflow-family code `asr` is derived from the folder name `agent-substrate-readiness`.

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `asr-001-v1-tool-substrate-diagnostic.md` | Tool Substrate Diagnostic | Scores any single tool against five structural properties (persistent state, state machine, ownership, defined verbs, audit history) with composite verdict and recommendations. |
| 002 | `asr-002-v1-organization-substrate-audit.md` | Organization Substrate Audit | Maps an organization's entire tool ecosystem by tier (Agent Infrastructure / Fixable Substrate / Wrapper Targets) with gap analysis, handoff fractures, and prioritized action plan. |
| 003 | `asr-003-v1-product-agent-readiness-blueprint.md` | Product Agent-Readiness Blueprint | Produces a data-model audit, state machine design, verb catalog, ownership model, and MCP server specification sketch for making any product agent-operable. |

## Revision guidance

When updating these prompts, increment the version number in the filename (e.g., `v1` → `v2`) and update the `Version` field in the document header. Preserve sequence numbers — they establish the intended workflow order and cross-referencing with the broader agentic workflow library.
