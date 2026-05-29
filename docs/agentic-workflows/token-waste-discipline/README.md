# Token Waste Discipline Prompt Kit

Source blog URL: `https://promptkit.natebjones.com/20260330_161_promptkit_1`
Folder: `docs/agentic-workflows/token-waste-discipline/`

## Purpose

This prompt kit turns Nate's token discipline framework into tools you can use right now. The centerpiece is the Stupid Button — a blunt, no-nonsense diagnostic that audits your actual AI habits and tells you exactly where you're hemorrhaging tokens. The remaining prompts help you fix what the diagnostic finds: rescuing bloated conversations, planning model routing, auditing agent architectures against the KISS commandments, and translating your usage into actual token math so you can see the waste for yourself.

## How to use these prompts

Start with Prompt 1 (The Stupid Button). Run it in Claude, ChatGPT, or Gemini. Be honest when it asks about your habits — it can't help you if you lie to it. It will give you a brutally direct assessment and prioritized fixes. Then use the other prompts based on what it finds:

- Hitting usage limits constantly? → Run Prompt 2 to rescue your current sprawling conversation, then start fresh.
- Not sure which model to use when? → Run Prompt 3 to build a model routing plan for your actual workflows.
- Building agents or API pipelines? → Run Prompt 4 to audit your architecture against the five KISS commandments.
- Want to see the math behind your waste? → Run Prompt 5 to get a full token economics breakdown.

The prompts work independently — use whichever ones match your situation.

## Naming convention

Document IDs use the pattern `[parent-folder]-[sequence]-v1`, where `[parent-folder]` is this prompt file's immediate parent folder, the three-digit sequence preserves the prompt order within this folder, and `v1` is the initial document version. The workflow-family code `twd` is derived from the folder name `token-waste-discipline`.

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `twd-001-v1-the-stupid-button-token-burn-diagnostic.md` | The Stupid Button — Token Burn Diagnostic | A blunt diagnostic that audits your AI habits and tells you exactly where you're wasting tokens, with a prioritized fix list. |
| 002 | `twd-002-v1-the-context-rescue-extract-and-compress-for-a-fresh-start.md` | The Context Rescue — Extract and Compress for a Fresh Start | Extracts the minimum viable context from a long conversation so you can start a clean new chat without losing your work. |
| 003 | `twd-003-v1-the-model-router-build-your-workflow-tier-map.md` | The Model Router — Build Your Workflow Tier Map | Creates a personalized model routing plan mapping tasks to the cheapest model tier that can handle them without quality loss. |
| 004 | `twd-004-v1-the-kiss-audit-agent-architecture-waste-finder.md` | The KISS Audit — Agent Architecture Waste Finder | Audits agent pipelines against the five KISS commandments and identifies where architecture is bleeding tokens. |
| 005 | `twd-005-v1-the-token-translator-make-the-invisible-visible.md` | The Token Translator — Make the Invisible Visible | Reconstructs the token math from your actual session to show exactly where your budget went, with before/after comparisons. |

## Revision guidance

When updating these prompts, increment the version number in the filename (e.g., `v1` → `v2`) and update the `Version` field in the document header. Preserve sequence numbers — they establish the intended workflow order and cross-referencing with the broader agentic workflow library.
