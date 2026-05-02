# Wiki Schema

Per-project conventions. LLM proposes changes; user approves. Co-evolves
with the wiki.

## Domain

Agentic AI — an AI-powered business assessment service for small
businesses. Scope: voice/chat agent design, assessment workflows, report
generation, integrations (Twilio, Retell, Stripe), and operational
runbooks. Out of scope: generic AI research, unrelated business domains.

## Source buckets

- `docs/` — in-project documentation and guides (reference)
- `conversations/` — agent chat transcripts, user tests (copy)
- `configs/` — agent JSON configs, knowledge bases (reference)
- `decks/` — pitch decks and presentation materials (reference)
- `figures/` — screenshots, diagrams, exports from decks (copy + companion .md)

## Topic taxonomy

- `business/` — service model, pricing, positioning, go-to-market
- `agents/` — voice/chat agent design, prompts, persona, scripts
- `integrations/` — Twilio, Retell, Stripe setup and wiring
- `reports/` — assessment structure, scoring, output formats
- `operations/` — deployment, testing procedures, compliance, disclaimers

## Page types

- `concept` — what something is (architecture, mechanism, design pattern)
- `decision` — why X was chosen over Y
- `bug` / `bugfix` — issues and resolutions
- `open-question` — known unknowns with triggers
- `source` — session or document summary (terse pointer)
- `reference` — commands, configs, API docs (lookup table)
- `synthesis` — filed query answer

## Lint rules

- Stale-claim threshold: 30 days
- Required tags: none (optional)

## Notes

- All in-project sources under `docs/` are stable paths — use references,
  not copies.
- JSON configs are treated as references (stable in repo).
- PPTX decks are binary references; extract text to companion `.md` if
  content needs to be searchable.
