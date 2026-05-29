# Auto-Improving Loop Readiness Prompt Kit

Source blog URL: `https://promptkit.natebjones.com/20260405_abp_promptkit_1`
Folder: `docs/agentic-workflows/auto-improving-loop-readiness/`

## Purpose

This kit gets you to the point where you could hand a problem to a meta-agent by forcing you through the prerequisite work most teams skip: defining what "better" means concretely, stress-testing that definition against gaming, and auditing whether your infrastructure can actually support the loop. It doesn't teach what auto-improvement is — it forces clarity on the three prerequisites most teams can't articulate when asked.

## How to use these prompts

Run these in order if you're starting from scratch. Prompt 1 defines your optimization target through a gated diagnostic (editable surface, metric, time budget). Prompt 2 attacks the metric you just defined by adversarially generating every way an autonomous agent could inflate it. Prompt 3 checks whether your current trace and observability infrastructure can support a meta-agent making targeted improvements.

Run them individually if you already have pieces in place. Already have a metric? Skip to Prompt 2. Already deploying agents with logging? Start with Prompt 3. Each prompt stands alone. Best run in a thinking-capable model like ChatGPT, Claude, or Gemini — these require sustained multi-turn reasoning where the AI needs to push back on vague answers.

Be honest with the prompts. They're designed to tell you "you're not ready yet" if you're not. That's the useful answer.

## Naming convention

Document IDs use the pattern `[parent-folder]-[sequence]-v1`, where `[parent-folder]` is this prompt file's immediate parent folder, the three-digit sequence preserves the prompt order within this folder, and `v1` is the initial document version. The workflow-family code `ailr` is derived from the folder name `auto-improving-loop-readiness`.

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `ailr-001-v1-the-karpathy-triplet-diagnostic.md` | The Karpathy Triplet Diagnostic | Gated diagnostic that forces clarity on the editable surface, the metric, and the time budget — producing either a program.md spec or a blocker report. |
| 002 | `ailr-002-v1-the-metric-gaming-pre-mortem.md` | The Metric-Gaming Pre-Mortem | Adversarially generates every way an autonomous agent could inflate a metric without delivering real business value, with countermeasures. |
| 003 | `ailr-003-v1-the-trace-infrastructure-audit.md` | The Trace Infrastructure Audit | Evaluates logging, tracing, and observability against 10 requirements for meta-agent support, with build-vs-buy recommendations. |

## Revision guidance

When updating these prompts, increment the version number in the filename (e.g., `v1` → `v2`) and update the `Version` field in the document header. Preserve sequence numbers — they establish the intended workflow order and cross-referencing with the broader agentic workflow library.
