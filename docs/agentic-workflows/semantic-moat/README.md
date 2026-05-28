# Semantic Moat Prompt Kit

Source: `https://promptkit.natebjones.com/20260504_eqj_promptkit_1`

## Purpose

This collection helps builders, product leaders, and strategists evaluate the gap between system access and semantic understanding in agentic AI products. The prompts cover product evaluation, agent-readiness, incident diagnosis, trust architecture, and strategic moat analysis.

## Naming convention

Prompt files use this scalable agentic workflow document pattern:

`semm-[sequence]-v[version]-[h2-title].md`

Where:

- `semm` = workflow family code for this collection
- `[sequence]` = three-digit prompt order from the source blog, starting at `001`
- `v[version]` = document version, starting at `v1`
- `[h2-title]` = the relevant blog H2 heading converted to lowercase URL-safe text with hyphens

All files for this collection live in one folder: `docs/semantic-moat/`.

## How to use these prompts

Use each prompt independently based on the decision at hand: evaluate an AI product, audit your own software's agent-readiness, diagnose an agent failure, design scoped trust and authority, or assess a company's semantic moat. Each prompt starts by interviewing you for the needed context.

Load or paste the full contents of the relevant Markdown file into an AI agent, then answer the prompt's discovery questions with concrete project, product, architecture, policy, or incident context. Save outputs as working artifacts for review, implementation, or follow-up analysis.

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `semm-001-v1-the-better-product-test.md` | The Better Product Test | Evaluate any AI product announcement or demo using the access-vs.-meaning framework from the article — and get a clear verdict on whether it exposes real work primitives or just wraps computer use in spectacle. |
| 002 | `semm-002-v1-agent-readiness-audit.md` | Agent-Readiness Audit | Assess how agent-native your software product actually is — mapping the gap between what humans see in the UI and what an agent can structurally understand — then produce a prioritized roadmap for semantic exposure. |
| 003 | `semm-003-v1-agent-failure-diagnosis.md` | Agent Failure Diagnosis | When an agent gets the action right but the decision wrong — or breaks something that looked fine in testing — diagnose whether the root cause was an access problem or a meaning problem, identify which specific type of meaning was missing, and recommend the structural fix. |
| 004 | `semm-004-v1-trust-architecture-designer.md` | Trust Architecture Designer | Design a scoped authority model for an agent deployment — mapping every action class to its appropriate permission level, review requirement, and escalation path. Turn "trusted write access" from a single switch into a graduated architecture. |
| 005 | `semm-005-v1-semantic-moat-analyzer.md` | Semantic Moat Analyzer | Evaluate where a company sits on the access-to-meaning spectrum and whether its strategic position is building a durable platform or becoming a feature — using the Salesforce-vs.-SAP and Stripe-vs.-checkout-clickers framing from the article. |

## Revision guidance

For future revisions, keep the same workflow family and sequence number, then increment the version. For example, update `-v1-` to `-v2-` when materially revising a prompt while preserving its place in the workflow set.
