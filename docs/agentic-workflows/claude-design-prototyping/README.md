# Claude Design Prototyping Prompt Kit

Source blog URL: `https://promptkit.natebjones.com/20260421_y1o_promptkit_1`
Folder: `docs/agentic-workflows/claude-design-prototyping/`

## Purpose

This kit operationalizes the article's core argument: most of your team structure was built around a prototyping cost that just disappeared. Four prompts help you extract a design system so Claude Design stops producing generic output, turn user stories into full-state prototypes in minutes, audit your org for roles that exist because prototyping used to be expensive, and decide what stays in Figma versus what moves.

## How to use these prompts

Prompt 1 (Design System Extractor) is the foundation — run it first. The design system file it produces becomes your opening context for every Claude Design session. Prompt 2 (PM Prototype Sprint) generates a ready-to-paste Claude Design prompt from your user stories. Prompt 3 (Org Audit) is a one-at-a-time diagnostic conversation best run in a thinking-capable model. Prompt 4 (Migration Decision Tree) takes your current design workflow and produces a concrete migration matrix. Run Prompt 3 before Prompt 4 for the org-level view, or Prompt 4 standalone if you just need to know what moves where.

## Naming convention

Document IDs use the pattern `[parent-folder]-[sequence]-v1`, where `[parent-folder]` is this prompt file's immediate parent folder, the three-digit sequence preserves the prompt order within this folder, and `v1` is the initial document version. The workflow-family code `cdp` is derived from the folder name `claude-design-prototyping`.

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `cdp-001-v1-the-design-system-extractor-brief.md` | The Design System Extractor Brief | Walks through brand visual identity and produces a structured design system file for Claude Design's opening context — with developer token spec and quick reference card. |
| 002 | `cdp-002-v1-the-pm-prototype-sprint.md` | The PM Prototype Sprint | Takes user stories and produces a structured Claude Design prompt that generates a multi-state working prototype (empty, error, loading, happy path, high-volume) with state coverage checklist. |
| 003 | `cdp-003-v1-the-is-this-still-a-real-role-org-audit.md` | The "Is This Still a Real Role?" Org Audit | Walks a leader through team structure one question at a time, categorizing roles as load-bearing, compensating for disappeared costs, or needing to shift upstream. |
| 004 | `cdp-004-v1-the-figma-to-claude-design-migration-decision-tree.md` | The Figma-to-Claude Design Migration Decision Tree | Produces a migration matrix for every artifact type with phased adoption plan and explicit "what not to move" list. |

## Revision guidance

When updating these prompts, increment the version number in the filename (e.g., `v1` → `v2`) and update the `Version` field in the document header. Preserve sequence numbers — they establish the intended workflow order and cross-referencing with the broader agentic workflow library.
