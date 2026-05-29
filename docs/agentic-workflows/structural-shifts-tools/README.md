# Structural Shifts Tools Prompt Kit

Source blog URL: `https://promptkit.natebjones.com/20260405_9b7_promptkit_1`
Folder: `docs/agentic-workflows/structural-shifts-tools/`

## Purpose

This kit turns the article's core analytical framework into six reusable tools. Each prompt operationalizes a different altitude of the "capability phase → economics phase" transition: filtering signal from noise, stress-testing inference economics, mapping infrastructure risk, assessing business model exposure, sorting AI vendors, and making developer architecture decisions. Together, they cover all five structural shifts and serve three distinct audiences — AI enthusiasts tracking the space, executives making investment and procurement decisions, and developers building on AI platforms.

## How to use these prompts

Pick the prompt that matches your decision. You don't need to run all six. Each is self-contained.

- Tracking the space broadly? Start with Prompt 1 (Weekly Structural Diff).
- Evaluating an AI product's viability? Prompt 2 (Inference Economics Stress Test) is the single most diagnostic tool here.
- Making compute or deployment decisions? Prompt 3 (Compute Geography & Infrastructure Risk) maps the physical constraints.
- Working at or investing in a SaaS company? Prompt 4 (Business Model Repricing Exposure Map) calculates your exposure.
- Choosing which AI vendors to bet on? Prompt 5 (AI Vendor Strategic Sort) runs each vendor through the five survival dimensions.
- Architecting what you're building? Prompt 6 (Developer Inference Architecture Decision) maps self-hosted vs. API vs. hybrid tradeoffs.

All prompts work in ChatGPT, Claude, or Gemini. Prompts 2 and 6 benefit from thinking-capable models. Prompts 1 and 5 benefit from models with web access when available.

## Naming convention

Document IDs use the pattern `[parent-folder]-[sequence]-v1`, where `[parent-folder]` is this prompt file's immediate parent folder, the three-digit sequence preserves the prompt order within this folder, and `v1` is the initial document version. The workflow-family code `sst` is derived from the folder name `structural-shifts-tools`.

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `sst-001-v1-weekly-structural-diff.md` | Weekly Structural Diff | Filters AI news through five altitudes (physics, monetization, geography, business models, geopolitics) to surface structural signals vs. noise. |
| 002 | `sst-002-v1-inference-economics-stress-test.md` | Inference Economics Stress Test | Calculates a sustainability ratio for any AI product with three-scenario stress testing and Sora-scale placement. |
| 003 | `sst-003-v1-compute-geography-infrastructure-risk-assessment.md` | Compute Geography & Infrastructure Risk Assessment | Maps physical, regulatory, and geopolitical risks across four dimensions with a contingency playbook. |
| 004 | `sst-004-v1-saas-business-model-repricing-exposure-map.md` | SaaS Business Model Repricing Exposure Map | Calculates seat compression exposure, The Clock, and transition readiness for any SaaS company. |
| 005 | `sst-005-v1-ai-vendor-strategic-sort.md` | AI Vendor Strategic Sort | Five-dimension vendor assessment with tripwire watchlist and portfolio strategy. |
| 006 | `sst-006-v1-developer-inference-architecture-decision.md` | Developer Inference Architecture Decision | Maps API-only vs. self-hosted vs. hybrid tradeoffs with Sora Test and migration path. |

## Revision guidance

When updating these prompts, increment the version number in the filename (e.g., `v1` → `v2`) and update the `Version` field in the document header. Preserve sequence numbers — they establish the intended workflow order and cross-referencing with the broader agentic workflow library.
