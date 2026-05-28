# AI Speed and Tooling Prompt Collection

Source URL: `https://promptkit.natebjones.com/20260331-6ro-promptkit-1`

## Purpose

This folder contains the prompt collection from Nate B. Jones's "Your AI Is 50x Faster. Your Tools Are Why It Doesn't Matter." Prompt Kit. The prompts help users calculate where AI workflow speedups are capped, audit whether tools are ready for agent-speed interaction, understand where human value moves as execution compresses, and encode tacit quality judgment into operational constraints for agents.

## How to use these prompts

Use any prompt independently based on the workflow problem you are solving. For tool and workflow performance work, start with the Amdahl Ceiling Calculator, then run the Agent-Readiness Audit against the tools creating friction. For personal or organizational judgment work, run the Upstream Value Self-Assessment and then the Institutional Taste Encoder.

Open the Markdown file for the workflow you want to run, copy the full prompt into an AI assistant, and provide the context requested by the prompt. The sequence numbers preserve the source blog's prompt order.

## Naming convention

Prompt files use this scalable document ID pattern:

`aispeed-[sequence]-v[version]-[h2-title].md`

Where:

- `aispeed` = workflow family for AI speed, tooling, and upstream-value workflows
- `[sequence]` = three-digit prompt order from the blog
- `v[version]` = prompt document version, starting at `v1`
- `[h2-title]` = the prompt's H2 title converted to lowercase, URL-safe hyphenated text

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `aispeed-001-v1-the-amdahl-ceiling-calculator.md` | The Amdahl Ceiling Calculator | Maps an AI-assisted workflow, separates model-time from tool-time and human-time, calculates the Amdahl speedup ceiling, and identifies the bottlenecks to fix first. |
| 002 | `aispeed-002-v1-agent-readiness-audit-for-your-tool-stack.md` | Agent-Readiness Audit for Your Tool Stack | Assesses enterprise tools for whether agents can use them at machine speed, categorizes agent-readiness, and recommends workarounds for slow or blocked tools. |
| 003 | `aispeed-003-v1-the-upstream-value-self-assessment.md` | The Upstream Value Self-Assessment | Helps a knowledge worker assess which parts of their role are appreciating or depreciating as AI compresses execution work. |
| 004 | `aispeed-004-v1-the-institutional-taste-encoder.md` | The Institutional Taste Encoder | Turns tacit quality judgment into reusable constraint specifications, evaluation rubrics, or decision trees that an AI agent can follow. |

## Revision guidance

For future revisions, keep the `aispeed` workflow family and the same sequence number, then increment the version segment from `v1` to `v2`, `v3`, and so on.
