# Tool Speedup Amdahl Prompt Kit

Source blog URL: `https://promptkit.natebjones.com/20260331_6ro_promptkit_1`
Folder: `docs/agentic-workflows/tool-speedup-amdahl/`

## Purpose

This kit turns the article's core frameworks into four working tools: calculate the actual ceiling on your AI speedup (it's lower than you think), audit your tool stack for agent-readiness, figure out where your human value is concentrating as execution compresses, and — the hardest one — take the tacit quality judgments living in your head and encode them into constraints an agent can actually follow.

## How to use these prompts

These four prompts are independent — use whichever ones match your situation. Prompt 1 (Amdahl Ceiling Calculator) is the fastest win: it shows you exactly where your AI investment is being wasted. Prompt 2 (Agent-Readiness Audit) is the strategic version for leaders making platform decisions. Prompt 3 (Upstream Value Self-Assessment) is personal and best done honestly. Prompt 4 (Institutional Taste Encoder) is the highest-leverage — if you're a senior person whose judgment is trapped in your head, this is the one that turns it into organizational infrastructure. All four work in any thinking-capable AI assistant.

## Naming convention

Document IDs use the pattern `[parent-folder]-[sequence]-v1`, where `[parent-folder]` is this prompt file's immediate parent folder, the three-digit sequence preserves the prompt order within this folder, and `v1` is the initial document version. The workflow-family code `tsa` is derived from the folder name `tool-speedup-amdahl`.

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `tsa-001-v1-the-amdahl-ceiling-calculator.md` | The Amdahl Ceiling Calculator | Maps every step of an AI-assisted workflow, calculates theoretical maximum speedup, and shows which bottlenecks to fix first. |
| 002 | `tsa-002-v1-agent-readiness-audit-for-your-tool-stack.md` | Agent-Readiness Audit for Your Tool Stack | Assesses each tool in your stack as Agent-Native, Agent-Accessible-but-Slow, or Agent Wall, with interim workarounds. |
| 003 | `tsa-003-v1-the-upstream-value-self-assessment.md` | The Upstream Value Self-Assessment | Maps current activities and strengths to four latent traits to identify what's appreciating vs. depreciating as execution compresses. |
| 004 | `tsa-004-v1-the-institutional-taste-encoder.md` | The Institutional Taste Encoder | Extracts tacit quality judgments into constraint specs, evaluation rubrics, or decision trees that AI agents can follow autonomously. |

## Revision guidance

When updating these prompts, increment the version number in the filename (e.g., `v1` → `v2`) and update the `Version` field in the document header. Preserve sequence numbers — they establish the intended workflow order and cross-referencing with the broader agentic workflow library.
