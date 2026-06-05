# Product Management After Software Becomes Cheap Prompt Kit

Source: https://promptkit.natebjones.com/20260518_265_promptkit_1

## Purpose

Two prompts that point in opposite directions — because the expensive mistake isn't failing to promote a prototype, it's quietly depending on dead software. The first classifies any internal artifact against a four-rung production-class ladder (Personal Tool → Team Beta → Supported Internal → Customer-Facing). The second audits tools the org already treats as supported and tests whether they should be demoted. Use them together in a weekly prototype review, or independently whenever something feels like it's in the wrong class. Both prompts classify the software, never the person who built it.

## How to Use These Prompts

**Prompt 1 (The Prototype Classifier)** is for when something new has appeared — a dashboard, automation, agent, or internal app that someone built — and you need to decide what it is and what should happen next. Paste it into ChatGPT, Claude, or Gemini and bring the facts. The prompt will ask you for them if you don't.

**Prompt 2 (The Demotion Audit)** is the mirror image. Use it on tools the org currently treats as team beta, supported internal, or customer-facing. It tests whether those tools still earn their class. Run it on a regular inventory review, or immediately when an owner leaves, usage drops, or you suspect something is being maintained out of habit.

## Naming Convention

Files follow the pattern: `{code}-{sequence}-v{version}-{h2-title}.md`

- `pmas` — Workflow-family code (Product Management After Software)
- `001` — Sequence number (zero-padded, order of prompts in source)
- `v1` — Version (incremented on future revisions)
- `the-prototype-classifier` — H2 heading in kebab-case

## Prompt Files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | pmas-001-v1-the-prototype-classifier.md | Prompt 1 — The Prototype Classifier | Classifies any internal artifact against the production-class ladder and returns gaps, outcome, and hidden dependency risk |
| 002 | pmas-002-v1-the-demotion-audit.md | Prompt 2 — The Demotion Audit | Tests whether tools currently at a production class still earn it, surfacing maintenance costs no one is watching |

## Revision Guidance

When revising prompts in the future, increment the version number (v2, v3, etc.) while keeping the sequence number unchanged. Preserve the document ID for cross-referencing across the agentic workflows system.
