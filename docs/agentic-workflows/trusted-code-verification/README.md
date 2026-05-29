# Trusted Code Verification Prompt Kit

Source blog URL: `https://promptkit.natebjones.com/20260504_qbn_promptkit_1`
Folder: `docs/agentic-workflows/trusted-code-verification/`

## Purpose

This kit provides two prompts built from the article's most actionable claims. The first audits whether your codebase is ready for Mythos-class adversarial review tools arriving in the next few months. The second diagnoses whether your eval suite for AI-generated code is dangerously skewed toward functional tests while ignoring the code-quality checks that determine whether the next system in the loop can actually defend what was written.

## How to use these prompts

Both prompts are independent — use either one on its own. Run them in a thinking-capable model like ChatGPT, Claude, or Gemini for the best results, since both require the AI to reason across multiple dimensions of your system before producing a structured assessment. You don't need to prepare anything in advance; each prompt will interview you before producing its output. Be honest and specific in your answers — vague inputs produce vague diagnostics.

## Naming convention

Document IDs use the pattern `[parent-folder]-[sequence]-v1`, where `[parent-folder]` is this prompt file's immediate parent folder, the three-digit sequence preserves the prompt order within this folder, and `v1` is the initial document version. The workflow-family code `tcv` is derived from the folder name `trusted-code-verification`.

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `tcv-001-v1-codebase-verification-readiness-audit.md` | Codebase Verification Readiness Audit | Interviews about your codebase and produces a readiness score for AI-powered adversarial security review across six dimensions, with prioritized blockers and a refactor plan. |
| 002 | `tcv-002-v1-eval-quality-diagnostic.md` | Eval Quality Diagnostic | Diagnoses your functional-to-quality eval ratio for AI-generated code and generates specific code-quality evals tailored to your language, framework, and domain. |

## Revision guidance

When updating these prompts, increment the version number in the filename (e.g., `v1` → `v2`) and update the `Version` field in the document header. Preserve sequence numbers — they establish the intended workflow order and cross-referencing with the broader agentic workflow library.
