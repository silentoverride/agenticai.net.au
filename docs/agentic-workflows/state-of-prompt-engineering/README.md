# State of Prompt Engineering Prompt Collection

Source URL: `https://promptkit.natebjones.com/20260225_hfy_promptkit_1`

## Purpose

This folder contains the prompt collection from Nate B. Jones's "State of Prompt Engineering" Prompt Kit. The collection turns the blog's four prompt-engineering disciplines into reusable agentic workflow documents: pre-AI thinking, rapid diagnostics, self-contained problem statements, context engineering, specification engineering, intent/delegation frameworks, evaluation harnesses, and constraint architecture.

## How to use these prompts

Start with `spe-001-v1-the-human-prompt.md` before any significant AI task. If you only have a few minutes, run the two quick-start prompts next. For a complete build-out, run the remaining prompts in order and keep the artifacts they produce as reusable operating documents.

Open the Markdown file for the workflow you want to run, copy the full prompt or exercise into your AI assistant or working notes, and provide the context requested by the prompt. The sequence numbers preserve the blog's recommended order.

## Naming convention

Prompt files use this scalable document ID pattern:

`spe-[sequence]-v[version]-[h2-title].md`

Where:

- `spe` = workflow family for State of Prompt Engineering workflows
- `[sequence]` = three-digit order within this prompt collection
- `v[version]` = document version, starting at `v1`
- `[h2-title]` = the prompt heading title converted to lowercase, URL-safe hyphenated text

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `spe-001-v1-the-human-prompt.md` | The Human Prompt | Gets your thinking out of your head and onto paper before opening an AI session, so you drive the work instead of reacting to the model. |
| 002 | `spe-002-v1-rapid-four-discipline-diagnostic-starter-context-doc.md` | Rapid Four-Discipline Diagnostic + Starter Context Doc | Identifies your biggest skill gap across the four disciplines and produces a usable personal context document in a single fast session. |
| 003 | `spe-003-v1-self-contained-problem-statement-rewriter.md` | Self-Contained Problem Statement Rewriter | Takes your typical vague, conversational AI requests and rewrites them as fully self-contained problem statements — the core primitive that Tobi Lütke identified as the fundamental skill. |
| 004 | `spe-004-v1-four-discipline-deep-diagnostic.md` | Four-Discipline Deep Diagnostic | Conducts a thorough assessment of your current AI skills across all four disciplines and produces a personalized 4-month development roadmap aligned to the article's progression. |
| 005 | `spe-005-v1-personal-context-document-builder.md` | Personal Context Document Builder | Produces a comprehensive personal context document — your "CLAUDE.md for everything" — through a structured deep interview about your work, standards, and institutional knowledge. |
| 006 | `spe-006-v1-specification-engineer.md` | Specification Engineer | Collaboratively builds a complete specification document for a real project — the kind of document an autonomous agent can execute against over hours or days without human intervention. |
| 007 | `spe-007-v1-intent-and-delegation-framework-builder.md` | Intent & Delegation Framework Builder | Extracts the implicit decision-making rules your team operates by and encodes them into a structured framework that both AI agents and human team members can act on. |
| 008 | `spe-008-v1-eval-harness-builder.md` | Eval Harness Builder | Creates a personal evaluation suite — the Lütke pattern — for your recurring AI tasks, so you can systematically test quality and catch regressions across model updates. |
| 009 | `spe-009-v1-constraint-architecture-designer.md` | Constraint Architecture Designer | Takes a task you're about to delegate and systematically identifies the constraint architecture — musts, must-nots, preferences, and escalation triggers — that prevents the smart-but-wrong failure mode. |

## Revision guidance

For future revisions, keep the `spe` workflow family and the same sequence number, then increment the version segment from `v1` to `v2`, `v3`, and so on.
