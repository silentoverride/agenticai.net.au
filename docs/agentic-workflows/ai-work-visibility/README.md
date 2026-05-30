# AI Work Visibility Prompt Kit

Source: https://promptkit.natebjones.com/20260512_837_promptkit_1

## Purpose

This kit turns the article's central argument — that private AI work helps individuals while public AI work helps the company learn — into three operational tools. Each prompt addresses a different bottleneck: formatting messy AI sessions into teachable posts, drawing the sensitivity boundary so teams share the right work safely, and helping senior leaders model their AI judgment in public channels.

## How to use this kit

Prompt 1 is the one you'll use most often. Every time you finish an AI work session that produced something useful (or failed instructively), run the transcript through it to create a clean post for your team's public channel. Prompt 2 should be run once per team or function to establish what belongs in the public channel and what stays private — pin the output. Prompt 3 is specifically for senior leaders or experienced operators who need a low-friction way to do real work in public without it feeling performative. All three work in ChatGPT, Claude, or Gemini.

## Naming Convention

Files follow the pattern: `{code}-[sequence]-v[version]-[h2-title].md`

- **{code}**: `awv` — derived from "AI Work Visibility"
- **[sequence]**: Three-digit zero-padded number (001, 002, 003)
- **[version]**: Semantic version (v1, v2, etc.)
- **[h2-title]**: The original H2 heading, lowercased and hyphenated

## Prompt Files

| Sequence | File | Prompt | Purpose |
|----------|------|--------|---------|
| 001 | `awv-001-v1-the-workflow-formatter.md` | The Workflow Formatter | Turn raw AI work sessions into structured, teachable posts for team channels |
| 002 | `awv-002-v1-the-sensitivity-boundary-drawer.md` | The Sensitivity Boundary Drawer | Draw the line between what AI work can be shared publicly and what must stay private |
| 003 | `awv-003-v1-the-senior-leader-public-work-starter.md` | The Senior Leader Public Work Starter | Help senior leaders run real AI work in public channels, making their judgment visible |

## Revision Guidance

For future revisions of these prompts, increment the version number while preserving the sequence number. For example, a revised Workflow Formatter would become `awv-001-v2-the-workflow-formatter.md`. Keep the original v1 file for provenance. The sequence number is permanently assigned — new prompts added to this kit receive the next available sequence number.
