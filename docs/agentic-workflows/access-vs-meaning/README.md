# Access vs Meaning Prompt Kit

Source blog URL: `https://promptkit.natebjones.com/20260504_eqj_promptkit_1`
Folder: `docs/agentic-workflows/access-vs-meaning/`

## Purpose

Every AI product demo this year will look like progress. This kit gives you the frameworks to tell which announcements represent real semantic depth and which are just access wearing a tuxedo. Five prompts target distinct decisions: evaluating products, auditing your own software, diagnosing agent failures, designing trust architectures, and mapping strategic positioning.

## How to use these prompts

Each prompt is independent. If evaluating multiple products, run Prompt 1 once for each. If building software, start with Prompt 2 and use the output to inform Prompt 4. If an agent just broke something in production, go straight to Prompt 3. Best run in a thinking-capable model like ChatGPT, Claude, or Gemini.

## Naming convention

Document IDs use the pattern `[parent-folder]-[sequence]-v1`, where `[parent-folder]` is this prompt file's immediate parent folder, the three-digit sequence preserves the prompt order within this folder, and `v1` is the initial document version. The workflow-family code `avm` is derived from the folder name `access-vs-meaning`.

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `avm-001-v1-the-better-product-test.md` | The Better Product Test | 8-lens evaluation of any AI product (action vocabulary, permission encoding, risk classification, validation, semantic objects, authority scoping, memory, supervision reduction) with spectrum placement and verdict. |
| 002 | `avm-002-v1-agent-readiness-audit.md` | Agent-Readiness Audit | Work primitive inventory, 7-dimension semantic exposure map per primitive, chat-pane trap check, and phased roadmap for making software agent-native. |
| 003 | `avm-003-v1-agent-failure-diagnosis.md` | Agent Failure Diagnosis | Failure classification (access/execution/semantic), 7-layer semantic gap identification, causal chain trace, counterfactual, and structural fix recommendations. |
| 004 | `avm-004-v1-trust-architecture-designer.md` | Trust Architecture Designer | Action classification on 5 dimensions, 5-tier permission assignment (autonomous through agent-excluded), escalation rules, and autonomy expansion criteria. |
| 005 | `avm-005-v1-semantic-moat-analyzer.md` | Semantic Moat Analyzer | 6-dimension strategic analysis (semantic layer ownership, agent-readiness posture, disintermediation risk, platform boundary, access-to-meaning ratio, compounding vs supervision), archetype classification, and 12-24 month trajectory. |

## Revision guidance

When updating these prompts, increment the version number in the filename (e.g., `v1` → `v2`) and update the `Version` field in the document header. Preserve sequence numbers — they establish the intended workflow order and cross-referencing with the broader agentic workflow library.
