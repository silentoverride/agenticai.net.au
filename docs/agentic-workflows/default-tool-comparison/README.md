# Default Tool Comparison Prompt Kit

Source blog URL: `https://promptkit.natebjones.com/20260423_287_promptkit_02`
Folder: `docs/agentic-workflows/default-tool-comparison/`

## Purpose

Your company picked a default AI tool. It's bad at your job. You know it, but saying so lands as preference, not performance. This kit gives you two prompts that convert frustration into evidence and evidence into an ask your organization can actually act on.

## How to use these prompts

Start with Prompt 1 — before you have any data. It walks you through your actual weekly workflow, pressure-tests candidate jobs against four criteria, and hands you back the one job to measure plus a ready-to-use log template. Then go do the measurement — one job, two tools, one week.

Run Prompt 2 after you have the log. It generates three versions of your ask — one for your manager, one for your director, one for an executive — each shaped for what that altitude actually cares about. It also drafts objection responses using your specific numbers.

Both prompts work in any AI assistant — ChatGPT, Claude, Gemini. They're conversational: the AI asks you what it needs, so there's nothing to fill in before you paste.

## Naming convention

Document IDs use the pattern `[parent-folder]-[sequence]-v1`, where `[parent-folder]` is this prompt file's immediate parent folder, the three-digit sequence preserves the prompt order within this folder, and `v1` is the initial document version. The workflow-family code `dtc` is derived from the folder name `default-tool-comparison`.

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `dtc-001-v1-the-one-job-one-week-measurement-designer.md` | The One-Job, One-Week Measurement Designer | Walks through weekly workflow, identifies the best job for a default-vs-specialist comparison, and outputs a scoring table, success criterion, input checklist, and log template. |
| 002 | `dtc-002-v1-the-altitude-translator.md` | The Altitude Translator | Takes completed measurement log and generates three ready-to-deliver asks (IC-to-manager, manager-to-director, director-to-executive) with objection responses and one-page brief. |

## Revision guidance

When updating these prompts, increment the version number in the filename (e.g., `v1` → `v2`) and update the `Version` field in the document header. Preserve sequence numbers — they establish the intended workflow order and cross-referencing with the broader agentic workflow library.
