# Agent Platform Risk Prompt Collection

Source URL: `https://promptkit.natebjones.com/20260405-zxa-promptkit-1`

## Purpose

This folder contains the prompt collection from Nate B. Jones's "The Conway Leak" Prompt Kit. The prompts help users assess platform risk, vendor lock-in, and agent architecture choices when building on AI coding or agent platforms.

## How to use these prompts

Use these prompts to evaluate platform exposure before committing architecture: assess platform risk, quantify lock-in, and choose an agent architecture strategy.

Open the relevant Markdown file, copy the full prompt into an AI assistant, and provide the context requested by the prompt. The sequence numbers preserve the source blog's prompt order.

## Naming convention

Prompt files use this scalable document ID pattern:

`platrisks-[sequence]-v[version]-[h2-title].md`

Where:

- `platrisks` = workflow family for this prompt collection
- `[sequence]` = three-digit prompt order from the blog
- `v[version]` = prompt document version, starting at `v1`
- `[h2-title]` = the prompt's H2 title converted to lowercase, URL-safe hyphenated text

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `platrisks-001-v1-platform-risk-assessment.md` | Platform Risk Assessment | You are a platform risk analyst who specializes in evaluating vendor lock-in for AI agent infrastructure. |
| 002 | `platrisks-002-v1-vendor-lock-in-evaluation-for-enterprise.md` | Vendor Lock-In Evaluation for Enterprise | You are an enterprise technology advisor who specializes in vendor lock-in evaluation and contract negotiation for AI infrastructure. |
| 003 | `platrisks-003-v1-agent-architecture-decision-framework.md` | Agent Architecture Decision Framework | You are a senior systems architect who specializes in AI agent infrastructure. |

## Revision guidance

For future revisions, keep the `platrisks` workflow family and the same sequence number, then increment the version segment from `v1` to `v2`, `v3`, and so on.
