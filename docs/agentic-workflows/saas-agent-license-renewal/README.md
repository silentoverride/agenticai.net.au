# SaaS Agent License Renewal Prompt Kit

Source blog URL: `https://promptkit.natebjones.com/20260508_262_promptkit_1`
Folder: `docs/agentic-workflows/saas-agent-license-renewal/`

## Purpose

This kit addresses the new reality that SaaS renewals are no longer just about seat counts — every major vendor is adding a consumption meter for agent work on top of human seats. It gives builders the system touch map they need before procurement reviews their agent, and gives CFOs the vendor-specific question sequence they need before signing.

## How to use these prompts

Prompt 1 (Agent System Touch Map) is for anyone building or deploying agents that interact with enterprise SaaS platforms. Paste it into ChatGPT, Claude, or Gemini and describe what your agent does. You'll get back a structured map of every system touched, every operation classified, every likely meter identified, and every governed-path risk flagged. Run this before your agent hits production — or before procurement runs it for you.

Prompt 2 (Renewal Interrogation) is for CFOs, procurement leads, or IT leaders walking into SaaS renewals. Paste it in and tell it which contracts are coming up. You'll get a sequenced negotiation playbook with vendor-specific questions ordered by tactical impact — what to ask first to anchor, what to surface mid-conversation, and the one question each vendor will try to dodge.

Both prompts work independently. If you're a builder who also handles vendor relationships, run both — the touch map from Prompt 1 feeds directly into the negotiation prep from Prompt 2.

## Naming convention

Document IDs use the pattern `[parent-folder]-[sequence]-v1`, where `[parent-folder]` is this prompt file's immediate parent folder, the three-digit sequence preserves the prompt order within this folder, and `v1` is the initial document version. The workflow-family code `salr` is derived from the folder name `saas-agent-license-renewal`.

## Prompt files

| Sequence | File | Prompt | Purpose |
| --- | --- | --- | --- |
| 001 | `salr-001-v1-agent-system-touch-map.md` | Agent System Touch Map | Produces a structured map of every SaaS system your agent touches, classified by operation type, with vendor meter identification and governed-path risk flags. |
| 002 | `salr-002-v1-the-renewal-interrogation.md` | The Renewal Interrogation | Generates a vendor-specific, tactically sequenced question list for SaaS renewal negotiations covering agent licensing, credit meters, and the seat-to-work pricing shift. |

## Revision guidance

When updating these prompts, increment the version number in the filename (e.g., `v1` → `v2`) and update the `Version` field in the document header. Preserve sequence numbers — they establish the intended workflow order and cross-referencing with the broader agentic workflow library.
