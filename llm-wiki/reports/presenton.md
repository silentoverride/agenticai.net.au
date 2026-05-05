---
title: Presenton Report Generator
type: reference
updated: 2026-05-02
sources:
  - "https://docs.presenton.ai/"
  - "https://docs.presenton.ai/llms.txt"
  - "https://docs.presenton.ai/v3/get-started/quickstart"
  - "https://docs.presenton.ai/v3/contribution-guides/presentation-generation-flow"
  - "https://docs.presenton.ai/api-reference/v3-presentation/generate-presentation-sync-v3"
  - "https://docs.presenton.ai/api-reference/v3-presentation/create-presentation-from-json-sync-v3"
  - "https://docs.presenton.ai/api-reference/v3-presentation/export-presentation-as-pptx-or-pdf-v3"
  - "https://docs.presenton.ai/tutorial/create-data-reports-using-ai"
see_also:
  - "../business/service-model.md"
  - "../operations/report-pipeline.md"
  - "../integrations/stripe.md"
---

# Presenton Report Generator

> **Status:** Informational reference only. Presenton is not currently integrated in the live report pipeline. The pipeline produces structured JSON analysis and delivers email notifications directly without generating slide decks.

Presenton is an open-source (Apache 2.0) AI presentation generator used to format AI Business Assessment reports into professional visual decks. It serves as the report formatting step in the assessment pipeline: Kimi K2.6 (via Ollama Cloud) generates the structured content, and Presenton converts it into a polished PPTX or PDF deliverable.

## What Presenton Provides

| Capability | What it means for Agentic AI |
|-----------|------------------------------|
| **AI-generated presentations** | Convert assessment text into structured slide decks |
| **Multiple export formats** | PPTX (editable) or PDF (final deliverable) |
| **Template system** | Consistent branded look across all assessment reports |
| **Self-hostable** | Run on own infrastructure for data privacy |
| **Multi-LLM support** | Use GPT, Gemini, Kimi K2.6, or local Ollama models |
| **API-driven** | Integrate into the automated report pipeline |

## Deployment Options

| Option | Setup | Best For |
|--------|-------|----------|
| **Presenton Cloud** (api.presenton.ai) | Sign up, get API key | Quick start, no infrastructure |
| **Self-hosted (Docker)** | `docker run -p 5000:80 ghcr.io/presenton/presenton:latest` | Data privacy, cost control, custom models |

Agentic AI currently uses **Presenton Cloud** for report generation via API. Self-hosting is an option for future data sovereignty requirements.

## Self-Host Quickstart

```bash
# Linux/macOS
docker run -it --name presenton -p 5000:80 -v "./app_data:/app_data" \
  ghcr.io/presenton/presenton:latest

# Windows PowerShell
docker run -it --name presenton -p 5000:80 -v "${PWD}\app_data:/app_data" \
  ghcr.io/presenton/presenton:latest
```

Then open http://localhost:5000/. The `/docs` endpoint serves Swagger API documentation.

## API Overview

Base URL (Cloud): `https://api.presenton.ai/api/v3/`

Authentication: `Authorization: Bearer sk-presenton-xxxxxxxx`

### Core Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/presentation/generate` | POST | Generate from prompt/content (sync/async) |
| `/presentation/from-json` | POST | Create from structured JSON slides (sync/async) |
| `/presentation/export` | POST | Export generated presentation as PPTX/PDF/PNG |
| `/outlines/generate` | POST | Generate slide outlines from content |
| `/files/upload` | POST | Upload files for use in presentations |
| `/async-task/status` | GET | Check status of async operations |

### Generation Modes

**Sync** — blocking request, returns when complete. Good for small reports.
**Async** — returns task ID immediately; poll `/async-task/status` for completion. Better for long generation or when reliability matters.

## Generate from Prompt (Simplest)

```bash
curl -X POST https://api.presenton.ai/api/v3/presentation/generate \
  -H "Authorization: Bearer $PRESENTON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "AI Business Assessment for Harbour Lane Events...",
    "n_slides": 12,
    "language": "English",
    "tone": "professional",
    "verbosity": "standard",
    "theme": "professional-blue",
    "standard_template": "neo-general",
    "export_as": "pdf",
    "include_title_slide": true,
    "include_table_of_contents": false
  }'
```

Response:
```json
{
  "presentation_id": "3c90c3cc-0d44-4b50-8888-8dd25736052a",
  "path": "<download-url>",
  "edit_path": "<editor-url>",
  "credits_consumed": 45
}
```

## Create from JSON (Most Control)

For assessment reports with specific sections (executive summary, pain points, effort vs. impact matrix, recommendations), the JSON API gives precise slide-level control:

```bash
curl -X POST https://api.presenton.ai/api/v3/presentation/from-json \
  -H "Authorization: Bearer $PRESENTON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI Business Assessment — Harbour Lane Events",
    "language": "English",
    "theme": "professional-blue",
    "standard_template": "neo-general",
    "export_as": "pdf",
    "slides": [
      { "type": "title", "title": "AI Business Assessment", "subtitle": "Harbour Lane Events" },
      { "type": "content", "title": "Executive Summary", "bullets": [...] },
      { "type": "content", "title": "Pain Points Identified", "bullets": [...] },
      { "type": "content", "title": "Effort vs. Impact Matrix", "table": [...] },
      { "type": "content", "title": "Recommended Solutions", "bullets": [...] },
      { "type": "content", "title": "4-Day Quick Win Plan", "bullets": [...] },
      { "type": "content", "title": "Financial Impact", "bullets": [...] }
    ]
  }'
```

## Export Formats

```bash
curl -X POST https://api.presenton.ai/api/v3/presentation/export \
  -H "Authorization: Bearer $PRESENTON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "3c90c3cc-0d44-4b50-8888-8dd25736052a",
    "export_as": "pdf"
  }'
```

| Format | Use Case |
|--------|----------|
| `pptx` | Editable deliverable; client can modify |
| `pdf` | Final, uneditable report; professional share |
| `png` | Slide-by-slide images; social/web sharing |

## Templates and Themes

### Standard Templates

| Template | Style |
|----------|-------|
| `neo-general` | Clean, versatile |
| `neo-modern` | Contemporary, minimal |
| `neo-standard` | Classic business |
| `neo-swift` | Dynamic, bold |
| `general` | Legacy general template |
| `modern` | Legacy modern template |
| `standard` | Legacy standard template |
| `swift` | Legacy swift template |

Agentic AI uses **`neo-general`** or **`neo-modern`** for assessment reports.

### Built-in Themes

| Theme | Colour Palette |
|-------|---------------|
| `professional-blue` | Corporate blue |
| `professional-dark` | Dark mode, sophisticated |
| `edge-yellow` | Warm, energetic |
| `light-rose` | Soft, approachable |
| `mint-blue` | Fresh, modern |

Custom themes can be created with brand colours, typography, and logo.

## Generation Parameters

| Parameter | Options | Default | Purpose |
|-----------|---------|---------|---------|
| `tone` | default, casual, professional, funny, educational, sales_pitch | default | Writing voice |
| `verbosity` | concise, standard, text-heavy | standard | Text density per slide |
| `content_generation` | preserve, enhance, condense | — | How to process input text |
| `image_type` | stock, ai-generated | stock | Slide imagery source |
| `web_search` | true, false | false | Enable web grounding for content |
| `markdown_emphasis` | true, false | true | Enable markdown formatting |
| `include_title_slide` | true, false | true | Add title slide |
| `include_table_of_contents` | true, false | false | Add TOC slide |

## Report Generation Flow

Presenton fits into the Agentic AI report pipeline at the formatting stage:

```
Annie completes intake → Retell transcript
→ Kimi K2.6 (via Ollama Cloud) analyzes and structures content (markdown/JSON)
→ **Template mapper transforms analysis JSON into structured slides**
→ Presenton API receives from-json payload with 9-slide template
→ Presenton generates visual slide deck from neo-general template + professional-blue theme
→ Export as PPTX
→ Deliver to client within 48 hours
```

### Template Mapping

Agentic AI uses a custom slide structure derived from `docs/ai-tools-assessment-redacted.pptx`. The `template-mapper.ts` module transforms the LLM analysis JSON into a fixed 9-slide layout:

| Slide | Title | Content Source |
|-------|-------|----------------|
| 1 | **AI Tools Assessment** | Company name + assessment date |
| 2 | **Executive Summary** | Pain points (top 3) + executive summary from analysis |
| 3 | **The Opportunity at a Glance** | Hours reclaimable weekly + primary focus area |
| 4 | **Impact-Effort Matrix** | Quick wins, major projects, fill-ins mapped to 2×2 grid |
| 5–8 | **Recommended Solutions** | One slide per quick win: tool name, URL, why it fits, complexity, cost, setup time, hours saved |
| 9 | **4-Day Quick Wins Plan** | Day-by-day implementation schedule |
| 10 | **What Comes After Quick Wins** | Top 3 deeper opportunities |
| 11 | **Financial Impact** | Weekly hours returned, monthly net ROI, tool costs |
| 12 | **Your Next Steps** | Two-step call to action |

**Template:** `neo-general` | **Theme:** `professional-blue` | **Export:** `pptx`

### Why from-json Instead of generate

The pipeline uses Presenton's **`/presentation/from-json`** endpoint instead of the simpler `/presentation/generate` because:
- **Precise slide control:** Each slide has a fixed type, title, and bullet structure
- **Template consistency:** Every report follows the same 9-slide branded layout
- **Tool URL injection:** Researched tool URLs from Futurepedia/TAAFT are embedded directly into slide bullets
- **Fallback:** If `from-json` fails, the pipeline falls back to `/presentation/generate` for a best-effort deck

## Webhooks

Presenton supports webhook subscriptions for async tasks:
- Subscribe to events on generation completion
- Receive callbacks instead of polling

Endpoints:
- `POST /webhook/subscribe` — subscribe to webhook
- `GET /webhook/subscriptions` — list subscriptions
- `DEL /webhook/unsubscribe` — remove subscription

## Credits

Presenton Cloud uses a credit-based pricing model. Each generation consumes credits based on:
- Number of slides
- Content complexity
- Whether AI images are generated
- Export format

Check credits consumed in the API response (`credits_consumed`).

## Environment Variables (Self-Hosted)

Key configuration options for self-hosted instances:
- LLM provider selection (OpenAI, Anthropic, Google, Ollama, OpenAI-compatible)
- API keys for chosen provider
- GPU acceleration settings
- External database connection
- ComfyUI integration for AI image generation
- Pexels/Pixabay API keys for stock images

## Open Questions

- Should Agentic AI use sync or async generation for assessment reports?
- Which template (`neo-general` vs `neo-modern`) produces the most professional assessment look?
- Should reports be delivered as PDF (final) or PPTX (editable) by default?
- Does the report pipeline need webhook callbacks from Presenton, or is polling sufficient?
- Should Agentic AI create a custom theme with the brand colours?
- What is the credit cost per 12-slide assessment report?

## Links

- [Presenton Docs](https://docs.presenton.ai/)
- [API Reference](https://docs.presenton.ai/api-reference)
- [GitHub](https://github.com/presenton/presenton)
- [Dashboard](https://presenton.ai/dashboard)
- [audittemplate.ai](https://audittemplate.ai) — Corey's free assessment template (top-of-funnel)
