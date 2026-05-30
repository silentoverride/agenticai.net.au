# Reasoning Image Generation Prompt Kit

Source blog URL: `https://promptkit.natebjones.com/20260422_j64_promptkit_1`
Folder: `docs/agentic-workflows/reasoning-image-generation/`

## Purpose

This kit turns the article's core insight — that specification is the new ceiling for image generation — into five working tools. Each prompt targets a different role and use case, from building the brand-system document that compounds your returns on every future image generation session to auditing the middleware vendors whose differentiation just collapsed.

## How to use these prompts

Prompts 1 and 2 chain together. Start with the Brand System Document Builder, which interviews you and produces a structured prose document. Then feed that document into the Asset Brief Template Generator to get reusable templates for every asset type you produce regularly.

Prompts 3, 4, and 5 are standalone. The Red Team Forgery Audit is for trust/risk/legal teams. The UI Spec-to-Mockup prompt is for product and engineering leads working in Codex. The Middleware Vendor Audit is for CIOs and enterprise buyers evaluating design tooling contracts.

All five prompts work in ChatGPT, Claude, or Gemini. Use a thinking-capable model for Prompts 1 and 2 for best results.

## Naming convention

Document IDs use the pattern `[parent-folder]-[sequence]-v1`, where `[parent-folder]` is this prompt file's immediate parent folder, the three-digit sequence preserves the prompt order within this folder, and `v1` is the initial document version. The workflow-family code `rig` is derived from the folder name `reasoning-image-generation`.

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `rig-001-v1-brand-system-document-builder.md` | Brand System Document Builder | Interviews about brand identity and produces a 1,500-2,500 word prose document for standing context in image generation sessions. |
| 002 | `rig-002-v1-asset-brief-template-generator.md` | Asset Brief Template Generator | Generates 5-6 reusable fill-in-the-blank brief templates pre-loaded with brand constraints for common asset types. |
| 003 | `rig-003-v1-red-team-forgery-audit-planner.md` | Red Team Forgery Audit Planner | Designs structured red-team exercises testing AI-generated forgeries against existing verification controls, with remediation priority matrix. |
| 004 | `rig-004-v1-ui-spec-to-mockup-prompt-builder-for-codex.md` | UI Spec-to-Mockup Prompt Builder for Codex | Converts feature briefs into structured image generation prompts for Codex, with coding agent handoff prompt. |
| 005 | `rig-005-v1-middleware-vendor-audit-procurement-memo.md` | Middleware Vendor Audit & Procurement Memo | Analyzes design/image vendor stack against direct API pricing and produces a one-page procurement memo with renegotiation recommendations. |

## Revision guidance

When updating these prompts, increment the version number in the filename (e.g., `v1` → `v2`) and update the `Version` field in the document header. Preserve sequence numbers — they establish the intended workflow order and cross-referencing with the broader agentic workflow library.
