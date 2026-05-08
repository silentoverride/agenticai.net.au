# Deferred Optimizations — AI Assessment Pipeline & Validation

## Confirmed Improvements
### Pipeline Speed
- **Model switch to gemini-3-flash-preview (run 27):** 92,833ms → 12,537ms (−86.5%). Variance dropped from ±15-80% to ±4%.
- **User-utterances-only filter (run 11):** −52% (removing Agent: lines from transcript)
- **5000 char truncation (run 20):** −27% additional (capping filtered transcript)
- **Retry logic (run 22):** 3 attempts, exponential backoff. Crash rate 40% → 0%.
- **180s timeout (run 18):** 120s → 180s, prevents spurious timeouts.

### Input Validation (Zod)
- **Pipeline benchmark schema (run 34):** Validates transcript ≥100 chars, typed body.
- **Stripe webhook schema (run 35):** Validates event structure, replaces `Record<string, any>`.
- **Retell webhook schema (run 36):** Validates event + call structure, typed payload.
- All schemas validate in **<5µs** median throughput.

### Code Quality
- **Stripe webhook error propagation (ac5e55a):** Pipeline enqueue failures return 500 instead of silent 200. `markEventProcessed` gated on critical-work success.
- **Zod integration:** 3 endpoints now use type-safe validation instead of manual `typeof` checks + `Record<string, any>`.

## Tested & Discarded
- Aggressive prompt reduction, JSON mode, temperature 0.2/0.4/0.7, max_tokens 2048/3072, 4000 char truncation, compacted system prompt — no benefit or regressed.

## Known Issues
- **Pipeline is prompt-processing dominated:** ~12s of ~13s total is first-token latency. Input/output changes don't move the needle.
- **Gemini endpoint occasionally has ±5% variance:** Not controllable from client code.
- **Remaining endpoints without Zod validation:** assessment-transcript, create-assessment-checkout, create-retell-web-call, end-call, internal/run-pipeline, pipeline-status, send-assessment-sms, portal routes (~9 routes).
- **No CI/CD, zero automated tests:** Manual wrangler deploys only.
- **Dead Drizzle schema:** schema.ts has 7+ discrepancies from db.ts/migrations.

## Not Worth Pursuing
- **Parallelize tool lookup with analysis:** Doesn't affect benchmarked path.
- **Micro-optimizations (<1ms):** JSON.parse removal, filterUserUtterances regex.
- **Prompt caching:** Provider-side, not controllable from client.
- **Summarization pass:** Need smaller model; gemini is already the fastest option.
