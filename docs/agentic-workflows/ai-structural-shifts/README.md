# AI Structural Shifts Prompt Collection

Source URL: `https://promptkit.natebjones.com/20260405-9b7-promptkit-1`

## Purpose

This folder contains the prompt collection from Nate B. Jones's "5 Structural Shifts in AI" Prompt Kit. The prompts help users analyze AI industry shifts across inference economics, compute geography, SaaS pricing, vendor strategy, and developer architecture decisions.

## How to use these prompts

Use the Weekly Structural Diff to separate real shifts from noise, then run the focused prompts for inference economics, compute geography, SaaS exposure, vendor strategy, or developer architecture decisions.

Open the relevant Markdown file, copy the full prompt into an AI assistant, and provide the context requested by the prompt. The sequence numbers preserve the source blog's prompt order.

## Naming convention

Prompt files use this scalable document ID pattern:

`aishift-[sequence]-v[version]-[h2-title].md`

Where:

- `aishift` = workflow family for this prompt collection
- `[sequence]` = three-digit prompt order from the blog
- `v[version]` = prompt document version, starting at `v1`
- `[h2-title]` = the prompt's H2 title converted to lowercase, URL-safe hyphenated text

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `aishift-001-v1-weekly-structural-diff6-structural-shifts-that-actually-matter-filtering-out-benchmark-drama-and-launch-hype.md` | Weekly Structural Diff6 structural shifts that actually matter, filtering out benchmark drama and launch hype. | You are a structural analyst who specializes in identifying the shifts underneath AI news — not what happened, but what changed about the constraints, economics, dependencies, and power dynamics of the AI industry. |
| 002 | `aishift-002-v1-inference-economics-stress-test.md` | Inference Economics Stress Test | You are an AI product economics analyst. |
| 003 | `aishift-003-v1-compute-geography-and-infrastructure-risk-assessment.md` | Compute Geography & Infrastructure Risk Assessment | You are an infrastructure risk analyst specializing in the physical geography of AI compute. |
| 004 | `aishift-004-v1-saas-business-model-repricing-exposure-map.md` | SaaS Business Model Repricing Exposure Map | You are a SaaS business model analyst specializing in the repricing crisis triggered by AI agents. |
| 005 | `aishift-005-v1-ai-vendor-strategic-sort.md` | AI Vendor Strategic Sort | You are an AI vendor strategist who evaluates providers through the lens of structural sustainability, not just capability benchmarks. |
| 006 | `aishift-006-v1-developer-inference-architecture-decision-map.md` | Developer Inference Architecture Decision Map | You are a senior AI infrastructure architect who designs inference pipelines with economics as a first-class constraint. |

## Revision guidance

For future revisions, keep the `aishift` workflow family and the same sequence number, then increment the version segment from `v1` to `v2`, `v3`, and so on.
