# Deferred Optimizations — AI Assessment Pipeline

## Confirmed Improvements
- **User-utterances-only filter (run 11):** Removing Agent: lines from transcript before LLM analysis reduced 3-trial median from 92,833ms to 44,717ms (−52%). 39% prompt reduction (11,445→~6,939 chars). Also lowered variance from 80% to 65%.

## Tested & Discarded
- **Aggressively reduced system prompt (run 12):** Removed Rules section and condensed key-type definitions. Median 54,634ms vs best 44,717ms (+22%). Removing enum constraints likely made the model's output less focused/slower.
- **JSON mode (run 13):** `response_format: {type: 'json_object'}` added constrained decoding overhead. Median 87,596ms vs 44,717ms (+96%).
- **Temperature 0.2 & 0.7:** Both timed out at 120s. Lower temperature slows generation, higher temperature doesn't help. Likely the shared endpoint was congested during these tests (see issue #4).
- **max_tokens=2048 (run 14):** Truncated output — JSON parse failed. Insufficient for the ~1800-token report.
- **max_tokens=3072 (run 15):** Could not evaluate — endpoint timed out.

## Known Issues

1.  **High API variance on baseline.** Three consecutive runs with identical code
    produced 22s, 36s, and 49s for the same transcript. This means single-run
    comparisons are unreliable.
    - **Mitigated**: 3-trial median script (`scripts/bench-pipeline-3x.mjs`) now standard.
    - **Update**: Variance dropped from ±80% to ±65% with smaller prompts.

2.  **Model availability.** `deepseek-4-fast:cloud` does not exist on the user's
    Ollama instance. The working model is `deepseek-v4-flash:cloud`.

3.  **Prompt size.** System prompt ~850 chars + filtered transcript ~7k chars.
    Total ~8k chars.

4.  **Ollama endpoint availability.** As of 2026-05-08 ~21:00 UTC, the endpoint at
    api.ollama.ai was timing out at 180s (4 consecutive experiments failed). May be
    transient congestion or an outage.

## Hypotheses to Try (when endpoint is responsive)

- **max_tokens=3072** — 25% reduction from 4096. Failed due to endpoint timeout;
  worth retesting.
- **Re-test temperature 0.4** — Previous temp tests timed out during endpoint
  congestion. A milder reduction might still help.
- **Add a cheap summarization pass** with a smaller model, then analyze the
  summary instead of the raw transcript.
- **Try prompt caching / use_cache** — If the Ollama provider supports prompt
  caching for repeated system prompts, the ~850-char prefix could be cached.
- **Parallelize tool lookup with analysis** — Start both async paths simultaneously
  instead of sequentially (would benefit the full pipeline, not just the benchmark).
- **Measure time-to-first-token (TTFT)** separately from total duration to
  isolate prompt-processing vs generation phases.
