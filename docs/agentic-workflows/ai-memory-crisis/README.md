# AI Memory Crisis Prompt Collection

Source URL: `https://promptkit.natebjones.com/20260326-o81-promptkit-1`

## Purpose

This folder contains the prompt collection from Nate B. Jones's "The AI Memory Crisis" Prompt Kit. The prompts turn the article's infrastructure and workflow arguments into practical tools: one for modeling GPU fleet economics under KV cache compression, and one for auditing where AI workflows lose or repeatedly reconstruct context.

## How to use these prompts

Use the prompt that matches your situation. Run the GPU Fleet Compression Calculator when sizing inference infrastructure, reviewing GPU costs, or deciding whether compression tooling can delay hardware purchases. Run the Memory Architecture Audit when AI sessions, tools, agents, or teams keep losing context and you need a concrete fix list.

Open the relevant Markdown file, copy the full prompt into an AI assistant, and provide the setup details it asks for. The sequence numbers preserve the source blog's prompt order.

## Naming convention

Prompt files use this scalable document ID pattern:

`aimem-[sequence]-v[version]-[h2-title].md`

Where:

- `aimem` = workflow family for AI memory, context, and compression workflows
- `[sequence]` = three-digit prompt order from the blog
- `v[version]` = prompt document version, starting at `v1`
- `[h2-title]` = the prompt's H2 title converted to lowercase, URL-safe hyphenated text

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `aimem-001-v1-gpu-fleet-compression-calculator.md` | GPU Fleet Compression Calculator | Calculates how KV cache compression changes GPU inference concurrency, cost per token, effective fleet capacity, and hardware-buying decisions. |
| 002 | `aimem-002-v1-memory-architecture-audit.md` | Memory Architecture Audit | Maps where AI workflows leak or reconstruct context, scores the resulting context tax, and produces a prioritized fix list. |

## Revision guidance

For future revisions, keep the `aimem` workflow family and the same sequence number, then increment the version segment from `v1` to `v2`, `v3`, and so on.
