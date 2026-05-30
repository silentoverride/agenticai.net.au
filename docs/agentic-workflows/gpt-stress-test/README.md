# GPT Stress Test Prompt Kit

Source blog URL: `https://promptkit.natebjones.com/20260427_ysh_promptkit_1`
Folder: `docs/agentic-workflows/gpt-stress-test/`

## Purpose

This kit is not about asking better questions — it is about giving AI real work that used to break models a release ago. Built around the core lesson of the GPT-5.5 review, the prompts help you raise your ambition for what you delegate: finding the hardest task worth trying, producing multi-artifact work packages, running validated data migrations, writing structure-first long-form drafts, and routing tasks to the right tool.

## How to use these prompts

Start with Prompt 1. It will interview you, find the most ambitious task you can realistically delegate, and write the Codex prompt for you. Prompts 2-5 are specific hard-task templates for the kinds of work the review tested: multi-artifact business packages, messy data migrations, long-form writing where structure matters, and model routing decisions.

Prompt 1 runs in ChatGPT first, then its output goes into Codex. Prompts 2 and 3 are built for Codex where the model can act on files and run code. Prompt 4 runs in any AI assistant that handles long-form text. Prompt 5 runs anywhere — it is a thinking tool, not an execution tool.

## Naming convention

Document IDs use the pattern `[parent-folder]-[sequence]-v1`, where `[parent-folder]` is this prompt file's immediate parent folder, the three-digit sequence preserves the prompt order within this folder, and `v1` is the initial document version. The workflow-family code `gst` is derived from the folder name `gpt-stress-test`.

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `gst-001-v1-the-stress-test-finder.md` | The Stress Test Finder | Interviews to find the most ambitious delegatable task, then writes a complete Codex prompt for it. |
| 002 | `gst-002-v1-the-multi-artifact-work-package.md` | The Multi-Artifact Work Package | Takes a messy business situation and produces complete deliverable sets (documents, decks, spreadsheets) with artifact contract and verification summary. |
| 003 | `gst-003-v1-the-validated-data-migration.md` | The Validated Data Migration | Migrates messy files into a clean database with schema design, rejection logic, conflict surfacing, duplicate merge reporting, and human review queue. |
| 004 | `gst-004-v1-the-structure-first-draft.md` | The Structure-First Draft | Turns notes and evidence into a long-form piece where the argument builds, with structural plan, full draft, and structural annotation. |
| 005 | `gst-005-v1-the-task-router.md` | The Task Router | Analyzes upcoming work and routes each task to the best model/surface combination with reasoning and multi-model workflow sequences. |

## Revision guidance

When updating these prompts, increment the version number in the filename (e.g., `v1` → `v2`) and update the `Version` field in the document header. Preserve sequence numbers — they establish the intended workflow order and cross-referencing with the broader agentic workflow library.
