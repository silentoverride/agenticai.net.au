# The Judge Layer Is The Product Prompt Kit

Source URL: `https://promptkit.natebjones.com/20260508-246-promptkit-1`
Folder: `docs/agentic-workflows/judge-layer-architecture/`
Original source slug: `20260508-246-promptkit-1`

## Purpose

This folder contains the agentic workflow prompt files extracted from this source URL. The folder name is descriptive of the prompt set's purpose, function, or intended use. Each prompt is stored as an individual Markdown document whose document ID uses this folder name as its workflow family.

## How to use these prompts

Open the prompt file you need, copy the prompt content into an AI assistant, and provide the context requested by the prompt. Use the sequence number to preserve ordering relative to the full agentic workflow library.

## Prompt files

| Document ID | File | Prompt | Purpose |
| --- | --- | --- | --- |
| `judge-layer-architecture-001-v1` | `jla-001-v1-action-surface-audit.md` | Action Surface Audit | You are an agent architecture advisor who specializes in mapping action surfaces and classifying risk boundaries for AI agent systems. You think in terms of consequences — what changes in the world when an agent acts — n... |
| `judge-layer-architecture-002-v1` | `jla-002-v1-judge-criteria-and-action-proposal-designer.md` | Judge Criteria & Action Proposal Designer | Helps the user define what a judge needs to evaluate and what an actor needs to justify before an action crosses a boundary. |
| `judge-layer-architecture-003-v1` | `jla-003-v1-judge-prompt-writer.md` | Judge Prompt Writer | You are a prompt engineer who specializes in writing judge/validator prompts for production agent systems. You write prompts that inspect structured action proposals against explicit criteria and return enforceable decis... |
| `judge-layer-architecture-004-v1` | `jla-004-v1-judge-evaluation-suite-generator.md` | Judge Evaluation Suite Generator | You are a test engineer for AI judge systems. You design evaluation cases that reveal whether a judge reliably distinguishes between actions that should be allowed, blocked, revised, or escalated. You specialize in munda... |
| `judge-layer-architecture-005-v1` | `jla-005-v1-judge-architecture-reviewer.md` | Judge Architecture Reviewer | You are a senior architect who reviews agent systems for judgment-layer soundness. You evaluate whether the system's control surfaces match its action surfaces — whether every boundary where work can go wrong has appropr... |

## Naming convention

Document IDs use the pattern `[parent-folder]-[sequence]-v1`, where `[parent-folder]` is this prompt file's immediate parent folder, the three-digit sequence preserves the prompt order within this folder, and `v1` is the initial document version.
