# Personal AI Computer Prompt Kit

Source blog URL: `https://promptkit.natebjones.com/20260427_8f2_promptkit_1`
Folder: `docs/agentic-workflows/personal-ai-computer/`

## Purpose

Two prompts that turn the six-layer personal AI stack from architecture into action. The first plans your build from your actual workflows. The second classifies every task you do into local or cloud, giving you a concrete routing map so you decide instead of default.

## How to use these prompts

These prompts work in any AI assistant — ChatGPT, Claude, Gemini, or a local model. Both are conversational: you paste the prompt, the AI asks you about your real work, and then it produces a structured plan. Use Prompt 1 when you're ready to buy or build. Use Prompt 2 first if you're not sure what belongs local vs. cloud. They pair well: run Prompt 2 to get your routing map, then feed those conclusions into Prompt 1 for the actual build plan.

## Naming convention

Document IDs use the pattern `[parent-folder]-[sequence]-v1`, where `[parent-folder]` is this prompt file's immediate parent folder, the three-digit sequence preserves the prompt order within this folder, and `v1` is the initial document version. The workflow-family code `pac` is derived from the folder name `personal-ai-computer`.

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `pac-001-v1-personal-ai-stack-planner.md` | Personal AI Stack Planner | Builds a phased local AI computer plan with hardware, runtime, models, memory, and apps matched to actual workflows — plus a skip list and first-week win. |
| 002 | `pac-002-v1-local-vs-cloud-routing-map.md` | Local vs. Cloud Routing Map | Classifies every weekly workflow as local-appropriate or cloud-appropriate using four criteria (privacy, frequency, capability, cost), with routing table and honest cloud list. |

## Revision guidance

When updating these prompts, increment the version number in the filename (e.g., `v1` → `v2`) and update the `Version` field in the document header. Preserve sequence numbers — they establish the intended workflow order and cross-referencing with the broader agentic workflow library.
