# Deferred Optimizations — AI Assessment Pipeline

## Confirmed Improvements
- **User-utterances-only filter (run 11):** Removing Agent: lines from transcript before LLM analysis reduced 3-trial median from 92,833ms to 44,717ms (−52%). 39% prompt reduction (11,445→~6,939 chars). Also lowered variance from 80% to 65%.
- **5000 char truncation (run 20):** Capped filtered transcript at 5000 chars. Further reduced median from 44,717ms to 32,616ms (−27%). Trial 1 was fastest ever at 27,860ms.
- **Retry logic (run 22):** 3 attempts with 5s/15s/45s exponential backoff for transient 503/timeout errors. Eliminated crash rate from ~40% to 0%.
- **Model switch to gemini-3-flash-preview (run 27):** Changed from deepseek-v4-flash. Median dropped from 32,616ms to 12,537ms (−62%). Variance collapsed from ±15-80% to ±4%.

## Tested & Discarded
- **Aggressively reduced system prompt (run 12):** Removed Rules section and condensed key-type definitions. Median 54,634ms vs best 44,717ms (+22%). Removing enum constraints likely made the model's output less focused/slower.
- **JSON mode (run 13):** `response_format: {type: 'json_object'}` added constrained decoding overhead. Median 87,596ms vs 44,717ms (+96%).
- **Temperature 0.2 & 0.7 (runs 13,15):** Both timed out on deepseek during endpoint congestion.
- **Temperature 0.4 (runs 26,30):** No meaningful effect on either deepseek or gemini. Within variance band on both.
- **max_tokens=3072 (runs 16,28):** No improvement on either model. Gemini is prompt-processing dominated, output ceiling irrelevant.
- **4000 char truncation (runs 21,29):** Incomplete on deepseek (503 errors), no benefit on gemini (+10% regression).
- **max_tokens=2048 (run 14):** Truncated output — JSON parse failed. Insufficient for the ~1800-token report.

## Known Issues
- **Endpoint variance:** The Ollama endpoint has variable congestion. Deepseek: ±15-80%. Gemini: ±4% (much more stable).
- **Prompt processing dominated:** On gemini, ~12s of the ~12.5s total is prompt processing (first token). Reducing input further doesn't help at 5000 chars.
- **Model availability:** `gemini-3-flash-preview` is confirmed working on the ollama.com endpoint.
- **The .env file:** After run 27, `.env` was updated to `OLLAMA_MODEL=gemini-3-flash-preview`. This change persists outside git.

## Hypotheses Not Worth Pursuing
- **Parallelize tool lookup with analysis:** Doesn't affect the benchmark (benchmark doesn't call tool lookup). Would improve production pipeline but not measurable.
- **Remove JSON.parse validation:** <1ms micro-optimization. Would not register through noise.
- **Prompt caching:** Depends on provider support — not something we can control from the client.
- **TTFT measurement:** Diagnostic-only. Would not improve speed.
- **Summarization pass:** Would need a smaller/cheaper model on the same endpoint. Gemini is already the fastest option.
