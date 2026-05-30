# Infrastructure as the Control Layer Prompt Kit

Source: https://promptkit.natebjones.com/20260512_v6e_promptkit_1

## Purpose

This prompt kit operationalizes the "Infrastructure as the Control Layer" framework for AI agent deployments. It provides three independent prompts that audit agent workflows for production readiness: a seven-row control map audit that surfaces gaps between demo-ready and production-ready agents, a vendor pitch pressure-test that cuts through over-specified-model-under-specified-control proposals, and a kill-switch architecture audit that identifies where your stop capability is real versus theatrical. Together, these prompts shift evaluation from "can the model do the thing?" to "can we control what the model does?"

## How to use these prompts

These three prompts are independent — use whichever one matches your situation right now. Prompt 1 is the flagship: take the one agent workflow your team is most likely to ship this quarter and run it through the control map. Prompt 2 is for the next vendor pitch or internal proposal that lands on your desk. Prompt 3 is for the moment you read "if the only kill switch is 'tell the model to stop,' the kill switch is not real" and felt a small panic. All three work in ChatGPT, Claude, or Gemini. Paste the prompt, answer the AI's questions, and get a usable artifact back.

## Naming Convention

Files follow the pattern: `{code}-[sequence]-v[version]-[h2-title].md`

- **{code}**: `icl` — derived from "Infrastructure Control Layer"
- **[sequence]**: Three-digit zero-padded number (001, 002, 003...)
- **[version]**: Semantic version (v1, v2, etc.)
- **[h2-title]**: The original H2 heading, lowercased and hyphenated

## Prompt Files

| Sequence | File | Prompt | Purpose |
|----------|------|--------|---------|
| 001 | `icl-001-v1-the-control-map-audit.md` | The Control Map Audit | Audit a planned agent workflow against seven control questions to identify production-readiness gaps before shipping |
| 002 | `icl-002-v1-the-vendor-pitch-pressure-test.md` | The Vendor Pitch Pressure-Test | Pressure-test an AI vendor pitch or internal proposal against the "over-specified on model, under-specified on control" frame |
| 003 | `icl-003-v1-the-kill-switch-architecture-audit.md` | The Kill Switch Architecture Audit | Audit where your agent's kill switch actually exists at five layers and where it's an illusion |

## Revision Guidance

For future revisions of these prompts, increment the version number while preserving the sequence number. For example, a revised control map audit would become `icl-001-v2-the-control-map-audit.md`. Keep the original v1 file for provenance. The sequence number is permanently assigned — new prompts added to this kit receive the next available sequence number.
