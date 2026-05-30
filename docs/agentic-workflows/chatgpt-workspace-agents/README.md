# ChatGPT Workspace Agents Prompt Kit

Source blog URL: `https://promptkit.natebjones.com/20260423_441_promptkit_1`
Folder: `docs/agentic-workflows/chatgpt-workspace-agents/`

## Purpose

This kit prevents the most common failure — building an agent for the wrong kind of work and concluding the product is bad — and produces the exact artifact the article says is the bar: a one-paragraph build spec specific enough to paste into ChatGPT's agent builder.

## How to use these prompts

Run these in any AI assistant — ChatGPT, Claude, Gemini all work. These prompts don't require Workspace Agents themselves; they help you decide what to build and write the spec before you open the agent builder.

Use them in order. Prompt 1 (Workflow-Fit Diagnostic) tells you whether a workflow belongs in Workspace Agents, a different tool, or needs more clarity before you build anything. If the verdict is "fit," take that workflow straight into Prompt 2 (Build-Paragraph Generator) to produce the spec you'll paste into the builder.

Bring a real workflow. These prompts work best when you walk in thinking about a specific recurring task that eats your team's time.

## Naming convention

Document IDs use the pattern `[parent-folder]-[sequence]-v1`, where `[parent-folder]` is this prompt file's immediate parent folder, the three-digit sequence preserves the prompt order within this folder, and `v1` is the initial document version. The workflow-family code `chwa` is derived from the folder name `chatgpt-workspace-agents`.

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `chwa-001-v1-workflow-fit-diagnostic.md` | Workflow-Fit Diagnostic | Evaluates a workflow against five criteria (repeats on schedule, recognizable good/bad, describable in a paragraph, crosses 2+ tools, path is known) and returns a verdict with next step. |
| 002 | `chwa-002-v1-build-paragraph-generator.md` | Build-Paragraph Generator | Produces a one-paragraph build spec with connectors, trigger, output channel, and one-week evaluation rubric — ready to paste into ChatGPT's agent builder. |

## Revision guidance

When updating these prompts, increment the version number in the filename (e.g., `v1` → `v2`) and update the `Version` field in the document header. Preserve sequence numbers — they establish the intended workflow order and cross-referencing with the broader agentic workflow library.
