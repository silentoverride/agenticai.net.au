# Agentic Commerce Protocol Prompt Kit

Source blog URL: `https://promptkit.natebjones.com/20260508_104_promptkit_1`
Folder: `docs/agentic-workflows/agentic-commerce-protocol/`

## Purpose

The old checkout page hid a dozen commercial responsibilities behind one human click. Agentic commerce pulls them apart — and if you're building in this space, you need to know which layers you own, which a partner owns, and which nobody owns yet. This kit gives you two artifacts: a responsibility map that exposes your architectural gaps, and a spending authorization spec that gets your agent past finance, legal, and security review.

## How to use these prompts

Prompt 1 (Responsibility Layer Audit) produces a one-page artifact showing exactly where commercial responsibility lives — and doesn't live — in your product. Prompt 2 (Agent Spending Authorization Spec) produces the document finance, legal, and security will demand the moment an agent goes near real money. Run Prompt 1 first. Both gather context conversationally.

## Naming convention

Document IDs use the pattern `[parent-folder]-[sequence]-v1`, where `[parent-folder]` is this prompt file's immediate parent folder, the three-digit sequence preserves the prompt order within this folder, and `v1` is the initial document version. The workflow-family code `acp` is derived from the folder name `agentic-commerce-protocol`.

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `acp-001-v1-the-responsibility-layer-audit.md` | The Responsibility Layer Audit | Maps six commercial layers (discovery, authorization, payment credential, settlement, merchant relationship, governance) to ownership labels with risk flags for unowned layers. |
| 002 | `acp-002-v1-the-agent-spending-authorization-spec.md` | The Agent Spending Authorization Spec | Five-section authorization spec (scope, limits, evidence layer, failure handling, escalation thresholds) plus Monday Morning Audit questions. |

## Revision guidance

When updating these prompts, increment the version number in the filename (e.g., `v1` → `v2`) and update the `Version` field in the document header. Preserve sequence numbers — they establish the intended workflow order and cross-referencing with the broader agentic workflow library.
