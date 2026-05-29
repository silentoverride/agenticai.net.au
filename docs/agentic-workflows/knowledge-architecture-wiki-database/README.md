# Knowledge Architecture Wiki Database Prompt Kit

Source blog URL: `https://promptkit.natebjones.com/20260405_2ro_promptkit_1`
Folder: `docs/agentic-workflows/knowledge-architecture-wiki-database/`

## Purpose

This kit helps you make the most consequential design decision in your AI workflow: how your AI remembers what it learns. Based on the write-time compilation (Karpathy wiki) vs. query-time retrieval (Open Brain) comparison, these prompts help you choose your architecture, design the schema that governs it, run the actual synthesis process, audit for failure modes, and blueprint a hybrid system.

## How to use these prompts

Start with Prompt 1 if you haven't decided on an approach yet — it produces a personalized recommendation based on your actual situation. Prompt 2 is essential for anyone building a wiki system — the schema is the highest-leverage document in the entire setup. Prompt 3 is the operational engine — use it every time you feed new sources into a wiki. Prompt 4 is for anyone with an existing knowledge setup that might be silently drifting or hiding contradictions. Prompt 5 designs a complete hybrid architecture if you want both approaches working together.

Run all prompts in a thinking-capable model like ChatGPT, Claude, or Gemini for best results. Prompts 3 and 4 work best when you can share actual files or content with the AI.

## Naming convention

Document IDs use the pattern `[parent-folder]-[sequence]-v1`, where `[parent-folder]` is this prompt file's immediate parent folder, the three-digit sequence preserves the prompt order within this folder, and `v1` is the initial document version. The workflow-family code `kawd` is derived from the folder name `knowledge-architecture-wiki-database`.

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `kawd-001-v1-knowledge-architecture-advisor.md` | Knowledge Architecture Advisor | Diagnoses your knowledge management situation and recommends wiki, database, or hybrid with rationale and implementation steps. |
| 002 | `kawd-002-v1-wiki-schema-editorial-policy-designer.md` | Wiki Schema & Editorial Policy Designer | Designs the schema document — page types, cross-referencing rules, contradiction handling, and editorial standards. |
| 003 | `kawd-003-v1-wiki-synthesis-agent.md` | Wiki Synthesis Agent | Acts as the AI maintainer: reads sources, produces or updates wiki pages with integration, contradictions, and cross-references. |
| 004 | `kawd-004-v1-knowledge-base-drift-contradiction-auditor.md` | Knowledge Base Drift & Contradiction Auditor | Audits existing knowledge bases for drift, hidden contradictions, stale syntheses, and missing connections. |
| 005 | `kawd-005-v1-hybrid-knowledge-system-blueprint.md` | Hybrid Knowledge System Blueprint | Designs a complete hybrid architecture with database as source of truth and wiki as the readable compilation layer. |

## Revision guidance

When updating these prompts, increment the version number in the filename (e.g., `v1` → `v2`) and update the `Version` field in the document header. Preserve sequence numbers — they establish the intended workflow order and cross-referencing with the broader agentic workflow library.
