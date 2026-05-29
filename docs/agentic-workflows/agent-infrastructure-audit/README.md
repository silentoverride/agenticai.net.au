# Agent Infrastructure Audit Prompt Kit

Source blog URL: `https://promptkit.natebjones.com/20260331_6yc_promptkit_1`
Folder: `docs/agentic-workflows/agent-infrastructure-audit/`

## Purpose

This kit gives you an interactive agent architecture audit based on the 12 infrastructure primitives revealed by the Claude Code leak. Describe your agent system (or your team's), and get back a prioritized gap analysis that tells you exactly what's missing and what to build next — organized by urgency tier from Day One non-negotiables through Month One sophistication.

## How to use these prompts

This kit contains one prompt: an Agent Architecture Audit that works for anyone building or evaluating agentic AI systems. Paste it into any thinking-capable model like ChatGPT, Claude, or Gemini. The prompt runs as an interview — it asks you questions one at a time, builds a picture of your system, then delivers a structured assessment. You don't need to prepare anything in advance. Whether you're a solo developer with a single-agent setup, an engineering lead evaluating production readiness, or an MCP developer wondering what you're missing beneath the tool layer, the audit adapts to your level of sophistication and tells you the three most important things to address next.

## Naming convention

Document IDs use the pattern `[parent-folder]-[sequence]-v1`, where `[parent-folder]` is this prompt file's immediate parent folder, the three-digit sequence preserves the prompt order within this folder, and `v1` is the initial document version. The workflow-family code `aia` is derived from the folder name `agent-infrastructure-audit`.

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `aia-001-v1-agent-architecture-audit.md` | Agent Architecture Audit | Evaluates any agentic AI system against the 12 production infrastructure primitives and delivers a prioritized gap analysis. |

## Revision guidance

When updating these prompts, increment the version number in the filename (e.g., `v1` → `v2`) and update the `Version` field in the document header. Preserve sequence numbers — they establish the intended workflow order and cross-referencing with the broader agentic workflow library.
