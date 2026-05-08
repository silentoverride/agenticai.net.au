# Deferred Optimizations — AI Assessment Pipeline

## Known Issues

1.  **High API variance on baseline.** Three consecutive runs with identical code
    produced 22s, 36s, and 49s for the same transcript. This means single-run
    comparisons are unreliable. Need a witness/control run alongside experiments
    or a statistical median from N trials.

2.  **Model availability.** `deepseek-4-fast:cloud` does not exist on the user's
    Ollama instance. The working model is `deepseek-v4-flash:cloud`.

3.  **Prompt size.** System prompt ~2k chars + transcript (up to 30k). Long
    transcripts inflate prompt tokens, increasing time-to-first-token.

## Hypotheses to Try

-   **Extract only user utterances** from the transcript before analysis.
    Discards agent voice, cuts prompt size ~30-50%, keeps signal.

-   **Add a cheap summarization pass** with a smaller model, then analyze the
    summary instead of the raw transcript.

-   **Truncate more aggressively** (15k chars instead of 30k) for long
    transcripts.

-   **Reduce system prompt** by removing the full JSON example and replacing it
    with a concise field list.

-   **Parallelize tool lookup** with analysis by starting both async paths
    simultaneously instead of sequentially.

-   **Add `prompt_cache` / `use_cache`** if the Ollama provider supports
    prompt caching for repeated system prompts.

-   **Measure time-to-first-token (TTFT)** separately from total duration to
    isolate prompt-processing vs generation phases.

-   **Run 3-trial median** for every experiment to account for API variance.
