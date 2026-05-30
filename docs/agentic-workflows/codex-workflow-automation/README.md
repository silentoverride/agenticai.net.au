# Codex Workflow Automation Prompt Kit

Source blog URL: `https://promptkit.natebjones.com/20260421_ozj_promptkit_1`
Folder: `docs/agentic-workflows/codex-workflow-automation/`

## Purpose

This kit turns the article's strategic analysis into three decision-making tools. The first audits your actual software stack to tell you where to deploy which agent. The second stress-tests your automation dependencies so you know what breaks and when. The third gives you a repeatable framework for reading AI lab acquisitions as strategic signals — useful every time a new deal drops.

## How to use these prompts

Prompt 1 is the starting point for most readers. Run it in any AI assistant and spend ten minutes walking through your actual workflows. The output is a triage map you can act on Monday. Prompt 2 builds on that audit or stands alone — for anyone who already has automations running and wants to know where the fragility lives. Prompt 3 is a different kind of tool: an analytical framework you'll reuse every time an acquisition headline crosses your feed. Run all three or pick the one that matches where you are right now.

## Naming convention

Document IDs use the pattern `[parent-folder]-[sequence]-v1`, where `[parent-folder]` is this prompt file's immediate parent folder, the three-digit sequence preserves the prompt order within this folder, and `v1` is the initial document version. The workflow-family code `cwa` is derived from the folder name `codex-workflow-automation`.

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `cwa-001-v1-workflow-audit-where-does-your-work-actually-live.md` | Workflow Audit — "Where Does Your Work Actually Live?" | Structured inventory of your daily software stack with triage map showing where to deploy Codex (GUI automation), Claude (structured work), and what to leave manual. |
| 002 | `cwa-002-v1-agent-dependency-assessment-how-exposed-is-your-automation-stack.md` | Agent Dependency Assessment — "How Exposed Is Your Automation Stack?" | Analyzes automation stacks through a dependency lens — API connectors, GUI stability, single points of failure — with risk matrix and mitigation recommendations. |
| 003 | `cwa-003-v1-acquisition-signal-tracker-what-the-talent-moves-tell-you.md` | Acquisition Signal Tracker — "What the Talent Moves Tell You" | Repeatable analytical framework for interpreting AI lab acquisitions as strategic signals — single deep dive, lab pattern analysis, or competitive comparison. |

## Revision guidance

When updating these prompts, increment the version number in the filename (e.g., `v1` → `v2`) and update the `Version` field in the document header. Preserve sequence numbers — they establish the intended workflow order and cross-referencing with the broader agentic workflow library.
