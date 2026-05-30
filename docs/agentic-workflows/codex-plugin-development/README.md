# Codex Plugin Development Prompt Kit

Source blog URL: `https://promptkit.natebjones.com/20260504_knu_promptkit_1`
Folder: `docs/agentic-workflows/codex-plugin-development/`

## Purpose

This kit takes you from "I have a workflow I keep re-explaining" to "I have a tested, installable Codex plugin." Seven prompts chain together to produce a workflow audit, decision tree, SKILL.md example, starter plugin structure, testing checklist, trust assessment, and refinement guide.

## How to use these prompts

The prompts chain in order but each stands alone. Start with the Workflow Audit if you're still figuring out what to package. Start with the Starter Plugin if you already know what you want to build. Jump to the Testing Checklist if you already built something and it's not behaving. Run in Codex, ChatGPT, Claude, or any model that can hold context and reason through a workflow.

## Naming convention

Document IDs use the pattern `[parent-folder]-[sequence]-v1`, where `[parent-folder]` is this prompt file's immediate parent folder, the three-digit sequence preserves the prompt order within this folder, and `v1` is the initial document version. The workflow-family code `cpd` is derived from the folder name `codex-plugin-development`.

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `cpd-001-v1-workflow-audit.md` | Workflow Audit | Inspects a repeated workflow and decides whether it's worth turning into a Codex skill or plugin. |
| 002 | `cpd-002-v1-decision-tree.md` | Decision Tree | Determines the right packaging level (prompt/skill/plugin/plugin with integrations). |
| 003 | `cpd-003-v1-skill-dot-md-example.md` | SKILL.md Example | Generates a complete starter SKILL.md file with trigger-optimized description. |
| 004 | `cpd-004-v1-starter-plugin.md` | Starter Plugin | Generates the plugin folder structure, plugin.json, and starter files. |
| 005 | `cpd-005-v1-testing-checklist.md` | Testing Checklist | Step-by-step testing checklist with pass/fail criteria and fix guidance. |
| 006 | `cpd-006-v1-trust-questions.md` | Trust Questions | Evaluates safety, clarity, and reliability before sharing or publishing. |
| 007 | `cpd-007-v1-plugin-refinement.md` | Plugin Refinement | Diagnoses post-test issues and recommends minimum fixes with retest checklist. |

## Revision guidance

When updating these prompts, increment the version number in the filename (e.g., `v1` → `v2`) and update the `Version` field in the document header. Preserve sequence numbers — they establish the intended workflow order and cross-referencing with the broader agentic workflow library.
