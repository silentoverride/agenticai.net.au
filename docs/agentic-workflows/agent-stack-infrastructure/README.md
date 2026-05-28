# Agent Stack Infrastructure Prompt Collection

Source URL: `https://promptkit.natebjones.com/20260328-0r0-promptkit-1`

## Purpose

This folder contains the prompt collection from Nate B. Jones's "The Agent Stack Is Real" Prompt Kit. The prompts convert the article's six-layer agent infrastructure framework into reusable diagnostics for auditing an agent stack and calculating compounded reliability across agent dependencies.

## How to use these prompts

Start with the Agent Stack Audit when you need to map an agent product or architecture across compute/sandboxing, identity/communication, memory/state, tool access/integration, provisioning/billing, and orchestration/coordination. Then use the Agent Reliability Calculator when the agent depends on multiple external services and you need to understand real end-to-end uptime.

Open the relevant Markdown file, copy the full prompt into an AI assistant, and provide the architecture, tool list, or dependency list it asks for. The sequence numbers preserve the source blog's prompt order.

## Naming convention

Prompt files use this scalable document ID pattern:

`agstack-[sequence]-v[version]-[h2-title].md`

Where:

- `agstack` = workflow family for agent stack infrastructure workflows
- `[sequence]` = three-digit prompt order from the blog
- `v[version]` = prompt document version, starting at `v1`
- `[h2-title]` = the prompt's H2 title converted to lowercase, URL-safe hyphenated text

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `agstack-001-v1-agent-stack-audit.md` | Agent Stack Audit | Maps an agent architecture to the six infrastructure layers, rates durability and risk, and produces shim-risk plus build/rent/watch recommendations. |
| 002 | `agstack-002-v1-agent-reliability-calculator.md` | Agent Reliability Calculator | Calculates compounded end-to-end reliability across agent dependencies and identifies where uptime fragility hides. |

## Revision guidance

For future revisions, keep the `agstack` workflow family and the same sequence number, then increment the version segment from `v1` to `v2`, `v3`, and so on.
