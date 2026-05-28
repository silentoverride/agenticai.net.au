# Code Verification Readiness Prompt Kit

Source: `https://promptkit.natebjones.com/20260504_qbn_promptkit_1`

## Purpose

This collection helps teams assess whether their codebases and eval systems are ready for AI-assisted and AI-powered adversarial code review. The prompts cover structural codebase legibility for security review and code-quality eval design for AI-generated code.

## Naming convention

Prompt files use this scalable agentic workflow document pattern:

`cvr-[sequence]-v[version]-[h2-title].md`

Where:

- `cvr` = workflow family code for this collection
- `[sequence]` = three-digit prompt order from the source blog, starting at `001`
- `v[version]` = document version, starting at `v1`
- `[h2-title]` = the relevant blog H2 heading converted to lowercase URL-safe text with hyphens

All files for this collection live in one folder: `docs/code-verification-readiness/`.

## How to use these prompts

Use these prompts when evaluating codebases that will be reviewed or modified by AI systems. Run the readiness audit to identify structural blockers, then use the eval diagnostic to improve the checks that catch maintainability, security, and code-quality failures beyond basic functionality.

Load or paste the full contents of the relevant Markdown file into an AI agent, then answer the prompt's discovery questions with concrete project, product, architecture, policy, or incident context. Save outputs as working artifacts for review, implementation, or follow-up analysis.

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `cvr-001-v1-codebase-verification-readiness-audit.md` | Codebase Verification Readiness Audit | Interviews you about your codebase and produces a readiness score for AI-powered adversarial security review, with prioritized blockers and a refactor plan for the next quarter. |
| 002 | `cvr-002-v1-eval-quality-diagnostic.md` | Eval Quality Diagnostic | Diagnoses whether your eval suite for AI-generated code is dangerously skewed toward functional tests, then generates the specific code-quality evals you're missing for your stack and domain. |

## Revision guidance

For future revisions, keep the same workflow family and sequence number, then increment the version. For example, update `-v1-` to `-v2-` when materially revising a prompt while preserving its place in the workflow set.
