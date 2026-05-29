# Project Explanation Artifact Prompt Kit

Source blog URL: `https://promptkit.natebjones.com/20260402_713_promptkit_1`
Folder: `docs/agentic-workflows/project-explanation-artifact/`

## Purpose

This kit contains one prompt — an interview-loop that forces you to articulate what you actually understand about something you built. The AI walks you through the four-question explanation template from the article, one question at a time, pushes back when your answers are vague, and assembles the result into a clean explanation artifact you can attach to your work. The outcome is either a polished proof-of-comprehension or an honest signal that you don't understand your own work as well as you thought. Both are valuable.

## How to use these prompts

Pick a real project — something you've already shipped. Paste the prompt into any AI assistant that can hold a multi-turn conversation. Answer honestly. The AI will ask you one question at a time and push back on hand-waving, marketing-speak, and "it just works" non-answers. At the end, you'll get a formatted explanation artifact with four sections (What Is This, Why This Approach, What Would Break, What I Learned). Paste it into your TalentBoard profile, project README, or personal site — wherever your work lives, the proof of understanding should live next to it.

The prompt is deliberately uncomfortable. If you breeze through it, you understood your project well. If you get stuck, you now know exactly where your comprehension gap is.

## Naming convention

Document IDs use the pattern `[parent-folder]-[sequence]-v1`, where `[parent-folder]` is this prompt file's immediate parent folder, the three-digit sequence preserves the prompt order within this folder, and `v1` is the initial document version. The workflow-family code `pea` is derived from the folder name `project-explanation-artifact`.

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `pea-001-v1-the-explanation-artifact-builder.md` | The Explanation Artifact Builder | Four-phase structured interview that pressure-tests understanding of a built project and assembles a clean explanation artifact. |

## Revision guidance

When updating these prompts, increment the version number in the filename (e.g., `v1` → `v2`) and update the `Version` field in the document header. Preserve sequence numbers — they establish the intended workflow order and cross-referencing with the broader agentic workflow library.
