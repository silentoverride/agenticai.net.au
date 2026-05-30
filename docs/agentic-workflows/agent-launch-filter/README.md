# Agent Launch Filter Prompt Kit

Source blog URL: `https://promptkit.natebjones.com/20260423_988_promptkit_1`
Folder: `docs/agentic-workflows/agent-launch-filter/`

## Purpose

This kit turns the article's three core frameworks — the five-question launch filter, the tool-to-work routing guide, and the layering-over-switching mindset — into prompts you can use immediately. Run any new launch through the filter, audit whether your current AI spend matches your actual work, and build a shareable decision tree your team can use to route tasks to the right tool.

## How to use these prompts

Prompt 1 (The Launch Filter) is the one you'll reuse most. Every time a new agent launch hits your feed, paste the announcement in and get a scored verdict in two minutes. Prompt 2 (The License Spend Audit) produces a memo you can hand to your CIO — run it once, revisit quarterly. Prompt 3 (The Layering Audit) transforms the "layering, not switching" insight into a shareable decision tree. All three gather context conversationally — just paste and go.

## Naming convention

Document IDs use the pattern `[parent-folder]-[sequence]-v1`, where `[parent-folder]` is this prompt file's immediate parent folder, the three-digit sequence preserves the prompt order within this folder, and `v1` is the initial document version. The workflow-family code `alf` is derived from the folder name `agent-launch-filter`.

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `alf-001-v1-the-launch-filter-applied.md` | The Launch Filter, Applied | Evaluates any AI agent launch against five filter questions (connectivity, openness, data access, ecosystem, stackability) with scored verdict and three concrete actions. |
| 002 | `alf-002-v1-the-license-spend-audit.md` | The License Spend Audit | Audits current AI tool spend against actual work patterns with tool-to-work fit matrix, wasted spend analysis, gaps identification, and one-page memo for leadership. |
| 003 | `alf-003-v1-the-layering-audit.md` | The Layering Audit | Builds a personalized decision tree routing weekly work across default AI tool and specialists using the three-bucket layering framework, with share-ready version. |

## Revision guidance

When updating these prompts, increment the version number in the filename (e.g., `v1` → `v2`) and update the `Version` field in the document header. Preserve sequence numbers — they establish the intended workflow order and cross-referencing with the broader agentic workflow library.
