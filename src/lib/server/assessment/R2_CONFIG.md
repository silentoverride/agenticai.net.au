# R2 Bucket Configuration

## Bucket Reference

| Bucket | Binding Name | Purpose |
|--------|-------------|---------|
| `assessment-blobs` | `assessment_blobs` | Intake transcripts, reports, stage artifacts |

## CORS Policy

Apply to the `assessment-blobs` R2 bucket via `wrangler r2 bucket cors`:

```bash
wrangler r2 bucket cors set assessment-blobs --cors-config '{
  "corsRules": [
    {
      "allowedOrigins": ["https://agenticai.net.au", "https://*.agenticai.pages.dev"],
      "allowedMethods": ["GET"],
      "allowedHeaders": ["*"],
      "maxAgeSeconds": 3600
    }
  ]
}'
```

This allows read access only from the application origin(s).
Write access is server-side only (via Cloudflare Workers with binding).

## Artifact Key Convention

All intake and pipeline artifacts use the following key structure:

```
assessments/{assessmentId}/transcript.json       # Raw intake transcript
assessments/{assessmentId}/meta.json             # Order/pipeline metadata
assessments/{assessmentId}/{stage}-{timestamp}.json  # Stage artifacts
reports/{reportId}/analysis.json                 # Final analysis
reports/{reportId}/transcript.txt                # Plain-text transcript
reports/{reportId}/meta.json                     # Report metadata
```

Where:
- `assessmentId` - Session ID from Stripe Checkout (`cs_test_...`) or Annie chat session
- `stage` - Pipeline stage name: `intake`, `tool-research`, `analysis`, `gate-quick-wins`, `gate-major-project`, `gate-report-review`
- `timestamp` - ISO 8601 with special characters replaced by hyphens
- `reportId` - Generated UUID-based ID for completed reports

## Data Lifecycle

- Raw intake transcripts: Retained indefinitely (immutable audit trail)
- Stage artifacts: Retained for 90 days (configurable)
- Reports: Retained indefinitely

## Access Patterns

- Server-side: R2 binding via `platform.env.assessment_blobs`
- Client-side: Via API endpoints only (no direct R2 URLs exposed)
