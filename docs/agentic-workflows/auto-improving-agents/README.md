# Auto-Improving Agents Prompt Collection

Source URL: `https://promptkit.natebjones.com/20260405-abp-promptkit-1`

## Purpose

This folder contains the prompt collection from Nate B. Jones's "Auto-Improving Agents" Prompt Kit. The prompts help users decide whether a system is ready for automated improvement by defining the optimization target, red-teaming the metric, and auditing trace infrastructure.

## How to use these prompts

Run the prompts in sequence when starting from scratch: define the editable surface, metric, and time budget; run a metric-gaming pre-mortem; then audit trace infrastructure readiness.

Open the relevant Markdown file, copy the full prompt into an AI assistant, and provide the context requested by the prompt. The sequence numbers preserve the source blog's prompt order.

## Naming convention

Prompt files use this scalable document ID pattern:

`autoimprove-[sequence]-v[version]-[h2-title].md`

Where:

- `autoimprove` = workflow family for this prompt collection
- `[sequence]` = three-digit prompt order from the blog
- `v[version]` = prompt document version, starting at `v1`
- `[h2-title]` = the prompt's H2 title converted to lowercase, URL-safe hyphenated text

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `autoimprove-001-v1-the-karpathy-triplet-diagnostic.md` | The Karpathy Triplet Diagnostic | You are a ruthlessly practical systems diagnostician who specializes in determining whether a business system is ready for automated optimization. |
| 002 | `autoimprove-002-v1-the-metric-gaming-pre-mortem.md` | The Metric-Gaming Pre-Mortem | You are an adversarial evaluation specialist — a red-teamer for metrics. |
| 003 | `autoimprove-003-v1-the-trace-infrastructure-audit.md` | The Trace Infrastructure Audit | You are an agent infrastructure auditor who specializes in trace and observability systems. |

## Revision guidance

For future revisions, keep the `autoimprove` workflow family and the same sequence number, then increment the version segment from `v1` to `v2`, `v3`, and so on.
