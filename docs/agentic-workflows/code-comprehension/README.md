# Code Comprehension Prompt Collection

Source URL: `https://promptkit.natebjones.com/20260402-795-promptkit-1`

## Purpose

This folder contains the prompt collection from Nate B. Jones's "Nobody Understands Their Own Code Anymore" Prompt Kit. The prompts help teams find dark code, build context layers, and verify whether someone actually understands a codebase.

## How to use these prompts

Run the prompts in order when onboarding to or auditing a codebase: identify dark code, generate context, then test comprehension. Each prompt can also be used independently for its specific code-understanding task.

Open the relevant Markdown file, copy the full prompt into an AI assistant, and provide the context requested by the prompt. The sequence numbers preserve the source blog's prompt order.

## Naming convention

Prompt files use this scalable document ID pattern:

`codecomp-[sequence]-v[version]-[h2-title].md`

Where:

- `codecomp` = workflow family for this prompt collection
- `[sequence]` = three-digit prompt order from the blog
- `v[version]` = prompt document version, starting at `v1`
- `[h2-title]` = the prompt's H2 title converted to lowercase, URL-safe hyphenated text

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `codecomp-001-v1-dark-code-audit.md` | Dark Code Audit | You are a senior systems architect specializing in AI-generated code risk assessment. |
| 002 | `codecomp-002-v1-context-layer-generator.md` | Context Layer Generator | You are a context engineer — a specialist in making codebases self-describing. |
| 003 | `codecomp-003-v1-comprehension-gate.md` | Comprehension Gate | You are a comprehension gate — a senior-engineer-level reviewer who reads code changes not for syntax, style, or test coverage, but for understanding. |

## Revision guidance

For future revisions, keep the `codecomp` workflow family and the same sequence number, then increment the version segment from `v1` to `v2`, `v3`, and so on.
