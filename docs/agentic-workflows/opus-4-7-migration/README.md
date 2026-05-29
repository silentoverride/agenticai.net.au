# Opus 4.7 Migration Prompt Kit

Source blog URL: `https://promptkit.natebjones.com/20260420_hpx_promptkit_1`
Folder: `docs/agentic-workflows/opus-4-7-migration/`

## Purpose

This kit provides three prompts that take you from "should I switch?" to "my stack is reliable." The first audits your current setup for breakage against Opus 4.7's breaking API changes, tokenizer shift, adaptive thinking system, and literal interpretation behavior. The second quantifies what the tokenizer change and adaptive thinking actually cost you. The third designs a peer review loop so neither model's self-assessment biases can burn you. Use them in sequence — fix what's broken, understand what it costs, then build the reliability layer.

## How to use these prompts

Prompt 1 (Migration Pre-Flight Check) is a five-minute triage. Paste your system prompt, API parameters, and routing setup. The AI identifies every breaking change, flags prompts that relied on 4.6's implicit inference, and gives you a Monday-morning action list. Run this in any capable model — ChatGPT, Claude, or Gemini all work.

Prompt 2 (Cost Impact Estimator) turns your usage data into a real cost projection. Feed it your use case mix and approximate token volumes. It estimates the combined tokenizer tax and adaptive thinking burn, then tells you where the model's efficiency gains offset the higher per-token cost and where they don't. Best in a thinking-capable model so the math is reliable.

Prompt 3 (Peer Review Workflow Builder) is the one that outlasts the article. Describe your agentic pipeline and get back a complete peer review architecture with model assignments, scoring rubrics, failure signatures, and handoff structure. Run in whichever model you trust for systems design.

All three prompts gather context conversationally. Use them in sequence.

## Naming convention

Document IDs use the pattern `[parent-folder]-[sequence]-v1`, where `[parent-folder]` is this prompt file's immediate parent folder, the three-digit sequence preserves the prompt order within this folder, and `v1` is the initial document version. The workflow-family code `o47m` is derived from the folder name `opus-4-7-migration`.

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `o47m-001-v1-migration-pre-flight-check.md` | Migration Pre-Flight Check | Audits your current Claude/API setup and produces a specific list of what breaks, what to change, and what to test before switching to Opus 4.7. |
| 002 | `o47m-002-v1-cost-impact-estimator.md` | Cost Impact Estimator | Estimates the real cost delta of moving to Opus 4.7, accounting for tokenizer tax, adaptive thinking burn, and efficiency gains. |
| 003 | `o47m-003-v1-peer-review-workflow-builder.md` | Peer Review Workflow Builder | Designs a complete peer review architecture for your agentic pipeline with model assignments, scoring rubrics, and failure signature detection. |

## Revision guidance

When updating these prompts, increment the version number in the filename (e.g., `v1` → `v2`) and update the `Version` field in the document header. Preserve sequence numbers — they establish the intended workflow order and cross-referencing with the broader agentic workflow library.
