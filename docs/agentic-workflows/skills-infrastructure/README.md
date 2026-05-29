# Skills Infrastructure Prompt Kit

Source blog URL: `https://promptkit.natebjones.com/20260324_kyk_promptkit_1`
Folder: `docs/agentic-workflows/skills-infrastructure/`

## Purpose

This prompt kit operationalizes the core thesis that your best prompting work is evaporating every session, and that skills are how methodology compounds instead. It walks you through the full arc: identifying which tasks should become skills, building them from your actual outputs (not your intentions), hardening them for agent callers, and planning how to share them across teams so expertise becomes institutional rather than personal.

## How to use these prompts

Work through these prompts in order. Each one builds on the last. Prompt 1 identifies your highest-ROI skill candidates. Prompt 2 takes one of those candidates and builds a production-ready SKILL.md using the output-extraction method. Prompt 3 stress-tests that skill against the agent-caller standard. Prompt 4 zooms out to the team level — which skills are organizational infrastructure, who should build them, and how to deploy them.

Run all four prompts in ChatGPT, Claude, or Gemini. These are conversational prompts that ask you questions before producing output. For Prompt 2, you'll get the best results by pasting in actual examples of your work, so use a model with a large context window. You don't have to do all four in one sitting — Prompt 1 is a 30-minute exercise, Prompt 2 is a focused two-hour build session, and Prompts 3 and 4 are for when you're ready to move from personal use to production pipelines and team deployment.

## Naming convention

Document IDs use the pattern `[parent-folder]-[sequence]-v1`, where `[parent-folder]` is this prompt file's immediate parent folder, the three-digit sequence preserves the prompt order within this folder, and `v1` is the initial document version. The workflow-family code `skil` is derived from the folder name `skills-infrastructure`.

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `skil-001-v1-skill-backlog-audit.md` | Skill Backlog Audit | Analyzes your recurring AI workflows and identifies which tasks should become skills, ranked by ROI. |
| 002 | `skil-002-v1-skill-builder-output-extraction-method.md` | Skill Builder (Output-Extraction Method) | Takes examples of your actual best work and reverse-engineers them into a production-ready SKILL.md file. |
| 003 | `skil-003-v1-agent-readiness-audit.md` | Agent-Readiness Audit | Takes an existing skill and stress-tests it against the four agent-caller criteria, producing a hardened version. |
| 004 | `skil-004-v1-team-skill-deployment-planner.md` | Team Skill Deployment Planner | Helps team leads identify their Tier 1, Tier 2, and Tier 3 skill priorities and build a deployment plan. |

## Revision guidance

When updating these prompts, increment the version number in the filename (e.g., `v1` → `v2`) and update the `Version` field in the document header. Preserve sequence numbers — they establish the intended workflow order and cross-referencing with the broader agentic workflow library.
