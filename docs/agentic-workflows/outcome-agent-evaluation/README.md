# Outcome Agent Evaluation Prompt Kit

Source blog URL: `https://promptkit.natebjones.com/20260326_ken_promptkit_1`
Folder: `docs/agentic-workflows/outcome-agent-evaluation/`

## Purpose

This kit gives you a single reusable prompt that applies the article's core framework — you are the test suite for knowledge work agents — in two phases. First, it evaluates any outcome agent tool against the three structural questions (persistent memory, inspectable surfaces, compounding context) for your specific use case. Then it builds a delegation spec calibrated to that tool's actual limitations, so you write the tests before you run the code.

## How to use these prompts

This is one prompt with two phases that feed each other. Phase 1 (evaluation) reveals where the tool is structurally weak. Phase 2 (delegation spec) patches those exact holes so the agent's output is verifiable before you hit go.

When to run it:

- Before committing to a new agent tool (Lindy, Sauna, Cowork, Opal, etc.)
- Before delegating a new type of task to a tool you're already using
- Before approving a vendor contract for agent tooling on your team

What to have ready: The name of the tool you're evaluating, and the task or workflow you want to hand off to it. The more specific you are about the task, the sharper the output. Run it in any thinking-capable AI assistant — ChatGPT, Claude, or Gemini.

## Naming convention

Document IDs use the pattern `[parent-folder]-[sequence]-v1`, where `[parent-folder]` is this prompt file's immediate parent folder, the three-digit sequence preserves the prompt order within this folder, and `v1` is the initial document version. The workflow-family code `oae` is derived from the folder name `outcome-agent-evaluation`.

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `oae-001-v1-agent-evaluation-calibrated-delegation-spec.md` | Agent Evaluation + Calibrated Delegation Spec | Evaluates any outcome agent tool against three structural dimensions and builds a delegation spec calibrated to its specific weaknesses. |

## Revision guidance

When updating these prompts, increment the version number in the filename (e.g., `v1` → `v2`) and update the `Version` field in the document header. Preserve sequence numbers — they establish the intended workflow order and cross-referencing with the broader agentic workflow library.
