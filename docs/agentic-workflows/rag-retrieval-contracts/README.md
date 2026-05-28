# New RAG War Not Vectors Prompt Kit

Source URL: `https://promptkit.natebjones.com/20260508-639-promptkit-2`
Folder: `docs/agentic-workflows/rag-retrieval-contracts/`
Original source slug: `20260508-639-promptkit-2`

## Purpose

This folder contains the agentic workflow prompt files extracted from this source URL. The folder name is descriptive of the prompt set's purpose, function, or intended use. Each prompt is stored as an individual Markdown document whose document ID uses this folder name as its workflow family.

## How to use these prompts

Open the prompt file you need, copy the prompt content into an AI assistant, and provide the context requested by the prompt. Use the sequence number to preserve ordering relative to the full agentic workflow library.

## Prompt files

| Document ID | File | Prompt | Purpose |
| --- | --- | --- | --- |
| `rag-retrieval-contracts-001-v1` | `rrc-001-v1-retrieval-contract-spec.md` | Retrieval Contract Spec | Helps the user produce a Retrieval Contract Spec — an engineering artifact that names exactly what the agent's retrieval system must deliver before the agent starts acting. |
| `rag-retrieval-contracts-002-v1` | `rrc-002-v1-retrieval-failure-triage.md` | Retrieval Failure Triage | Helps the user identify the specific retrieval failure mode, name the minimum fix, and prevent the builder from rebuilding more than the failure justifies. |
| `rag-retrieval-contracts-003-v1` | `rrc-003-v1-retrieval-stack-adr.md` | Retrieval Stack ADR | Helps the user produce an ADR that surfaces honest tradeoffs, forces real alternatives, and includes a rollback plan. |

## Naming convention

Document IDs use the pattern `[parent-folder]-[sequence]-v1`, where `[parent-folder]` is this prompt file's immediate parent folder, the three-digit sequence preserves the prompt order within this folder, and `v1` is the initial document version.
