# Compensating Complexity Prompt Kit

Source blog URL: `https://promptkit.natebjones.com/20260330_4ip_promptkit_1`
Folder: `docs/agentic-workflows/compensating-complexity/`

## Purpose

This prompt kit turns the article's core frameworks into hands-on tools for auditing and removing compensating complexity from your AI systems. Each prompt takes your actual systems, prompts, and team structure and applies the four-question audit, the what-vs-how separation, and the outcome-based architecture pattern to tell you exactly where your compensating complexity lives — and what to do about it.

## How to use these prompts

These four prompts are independent — use whichever ones match your situation right now. Prompt 1 is the starting point for most people: paste in a real system prompt and get a line-by-line diagnosis. Prompt 2 takes what Prompt 1 finds and rewrites the prompt using the four-component architecture. Prompt 3 zooms out to your team and org structure. Prompt 4 builds you a concrete action plan across all five Monday principles. Run any of these in ChatGPT, Claude, or Gemini. Bring real artifacts — actual system prompts, real pipeline descriptions, genuine team structures. The more specific your input, the more actionable the output.

## Naming convention

Document IDs use the pattern `[parent-folder]-[sequence]-v1`, where `[parent-folder]` is this prompt file's immediate parent folder, the three-digit sequence preserves the prompt order within this folder, and `v1` is the initial document version. The workflow-family code `comc` is derived from the folder name `compensating-complexity`.

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `comc-001-v1-the-compensating-complexity-audit.md` | The Compensating Complexity Audit | Analyzes your actual system prompt or AI pipeline and tags every component as outcome logic, constraint, scaffolding, or compensating complexity. |
| 002 | `comc-002-v1-the-outcome-based-system-prompt-rewriter.md` | The Outcome-Based System Prompt Rewriter | Rewrites your procedural system prompt into the four-component architecture: outcome specification, constraints, tools, and coordination pattern. |
| 003 | `comc-003-v1-the-org-level-model-dependency-map.md` | The Org-Level Model Dependency Map | Maps which roles and processes exist because of current model limitations versus genuinely needed regardless of capability. |
| 004 | `comc-004-v1-the-step-change-readiness-plan.md` | The Step-Change Readiness Plan | Builds a concrete, week-by-week action plan based on the five Monday principles, customized to your situation. |

## Revision guidance

When updating these prompts, increment the version number in the filename (e.g., `v1` → `v2`) and update the `Version` field in the document header. Preserve sequence numbers — they establish the intended workflow order and cross-referencing with the broader agentic workflow library.
