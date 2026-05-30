# Project File Organization Prompt Kit

Source: https://promptkit.natebjones.com/20260512_721_promptkit_1

## Purpose

Before you ask AI to write the memo, build the room. This kit provides four prompts that turn a messy folder of project files into an inspectable work surface — source inventory, duplicate log, missing-context list, working brief — so that the final draft is grounded instead of guessed at. The prompts chain in sequence but also work independently: build the room with Prompt 1 or 2, review the inventory, draft from the clean room with Prompt 3, and refresh with Prompt 4 when new files arrive.

## How to use these prompts

Choose your tool based on your source set:

- **Cursor or Claude Code** → when your project lives in a local folder tree and you need file-system operations. Use Prompt 1 (Project Room Builder).
- **Claude Projects, ChatGPT Projects, or NotebookLM** → when you've uploaded documents into a bounded workspace. Use Prompt 2 (Source Inventory & Audit).
- **Any tool** → Prompts 3 (Grounded Draft) and 4 (Project Room Refresh) work anywhere once you have the inventory.

The recommended sequence:

1. Run Prompt 1 or 2 to build the project room and source inventory
2. Review the inventory before moving on. Spot-check what the AI marked as authoritative vs. superseded. This is the checkpoint that matters.
3. Run Prompt 3 to draft the final deliverable from the clean room
4. Run Prompt 4 whenever new files arrive or the project shifts

The single most important output is the source inventory. Do not skip to Prompt 3 without reviewing it.

## Naming Convention

Files follow the pattern: `{code}-[sequence]-v[version]-[h2-title].md`

- **{code}**: `pfo` — derived from "Project File Organization"
- **[sequence]**: Three-digit zero-padded number (001, 002, 003, 004)
- **[version]**: Semantic version (v1, v2, etc.)
- **[h2-title]**: The original H2 heading, lowercased and hyphenated

## Prompt Files

| Sequence | File | Prompt | Purpose |
|----------|------|--------|---------|
| 001 | `pfo-001-v1-project-room-builder-file-system-tools.md` | Project Room Builder (File-System Tools) | Scan local project folders, create a structured project room, and build a full source inventory without touching originals |
| 002 | `pfo-002-v1-source-inventory-and-audit-upload-based-tools.md` | Source Inventory & Audit (Upload-Based Tools) | Build a source inventory, duplicate log, missing-context list, and working brief from documents already uploaded to a workspace |
| 003 | `pfo-003-v1-grounded-draft-from-clean-room.md` | Grounded Draft from Clean Room | Write the final deliverable from the reviewed source inventory with every claim traced to a source and every gap flagged |
| 004 | `pfo-004-v1-project-room-refresh.md` | Project Room Refresh | Update an existing project room when new files arrive, scope shifts, or the inventory needs a freshness check |

## Revision Guidance

For future revisions of these prompts, increment the version number while preserving the sequence number. For example, a revised Project Room Builder would become `pfo-001-v2-project-room-builder-file-system-tools.md`. Keep the original v1 file for provenance. The sequence number is permanently assigned — new prompts added to this kit receive the next available sequence number.
