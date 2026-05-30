# Platform Team Bottleneck Prompt Kit

Source: https://promptkit.natebjones.com/20260518_541_promptkit_1

## Purpose

When AI makes everyone faster, the platform team becomes the bottleneck. This kit gives platform and infrastructure engineers two documents that the article argues every team needs but almost nobody has built yet: a private eval suite for calibrating agent autonomy, and a tiered action-class policy that defines what agents can do at each blast-radius level. Both prompts interview you about your actual systems and produce structured docs you can take to your team.

## How to use this kit

Start with Prompt 1 (the eval suite) if you want to know *whether* agents are ready for your platform work. Start with Prompt 2 (the action-class policy) if agents are already doing work and you need to define *what they're allowed to do*. Both prompts work in any AI assistant — ChatGPT, Claude, Gemini — and run well in a single conversation. The outputs are designed as living documents: update them when new models drop or when your systems change.

## Naming Convention

Files follow the pattern: `{code}-[sequence]-v[version]-[h2-title].md`

- **{code}**: `ptb` — derived from "Platform Team Bottleneck"
- **[sequence]**: Three-digit zero-padded number (001, 002)
- **[version]**: Semantic version (v1, v2, etc.)
- **[h2-title]**: The original H2 heading, lowercased and hyphenated

## Prompt Files

| Sequence | File | Prompt | Purpose |
|----------|------|--------|---------|
| 001 | `ptb-001-v1-platform-eval-suite-generator.md` | Platform Eval Suite Generator | Turn real platform tasks into a structured eval document to calibrate agent autonomy against new models |
| 002 | `ptb-002-v1-action-class-and-blast-radius-policy-builder.md` | Action-Class and Blast-Radius Policy Builder | Produce a tiered policy defining what agents can do at each risk level with approval, rollback, and monitoring rules |

## Revision Guidance

For future revisions of these prompts, increment the version number while preserving the sequence number. For example, a revised Eval Suite Generator would become `ptb-001-v2-platform-eval-suite-generator.md`. Keep the original v1 file for provenance. The sequence number is permanently assigned — new prompts added to this kit receive the next available sequence number.
