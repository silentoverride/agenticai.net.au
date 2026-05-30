# Agent Judge Layer Prompt Kit

Source blog URL: `https://promptkit.natebjones.com/20260508_246_promptkit_1`
Folder: `docs/agentic-workflows/agent-judge-layer/`

## Purpose

This kit turns the architectural framework from "The Judge Layer Is The Product" into working tools for builders shipping production agents. Each prompt addresses a distinct stage of designing and implementing the judgment layer that sits between what an agent wants to do and what it's allowed to do — from mapping your action surface to writing judge prompts to building evaluation suites.

## How to use these prompts

These prompts work independently but chain naturally. Start with Prompt 1 if you're early — it maps your agent's action surface and tells you where judges are needed first. Start with Prompt 3 if you already know what action boundary you're building a judge for and need the actual prompt. Use a thinking-capable model for best results.

## Naming convention

Document IDs use the pattern `[parent-folder]-[sequence]-v1`, where `[parent-folder]` is this prompt file's immediate parent folder, the three-digit sequence preserves the prompt order within this folder, and `v1` is the initial document version. The workflow-family code `ajl` is derived from the folder name `agent-judge-layer`.

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `ajl-001-v1-action-surface-audit.md` | Action Surface Audit | Maps every agent action classified into four risk tiers (read-only through high-risk) with judge placement recommendations and build priority. |
| 002 | `ajl-002-v1-judge-criteria-action-proposal-designer.md` | Judge Criteria & Action Proposal Designer | Designs judge criteria as testable questions across four categories (authorization, evidence, exposure/risk, policy) plus structured action proposal format. |
| 003 | `ajl-003-v1-judge-prompt-writer.md` | Judge Prompt Writer | Produces a production-ready judge system prompt with four-outcome decision logic (allow, block, revise, escalate), anti-gaming instructions, and implementation notes. |
| 004 | `ajl-004-v1-judge-evaluation-suite-generator.md` | Judge Evaluation Suite Generator | Creates 20+ structured test cases across all four outcomes, focused on mundane boundary failures, with metrics guidance. |
| 005 | `ajl-005-v1-judge-architecture-reviewer.md` | Judge Architecture Reviewer | Audits agent systems across five dimensions (judge placement, failure modes, specialist judges, memory/provenance, human review) with remediation roadmap. |

## Revision guidance

When updating these prompts, increment the version number in the filename (e.g., `v1` → `v2`) and update the `Version` field in the document header. Preserve sequence numbers — they establish the intended workflow order and cross-referencing with the broader agentic workflow library.
