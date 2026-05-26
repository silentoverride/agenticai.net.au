/**
 * OpenAI GPT-5.5 Judge Gate Provider
 *
 * Evaluates content using OpenAI GPT-5.5 via direct `fetch()`.
 * No SDK dependencies — just HTTP POST to the OpenAI Chat Completions API.
 *
 * The provider produces a structured JSON verdict that the gate policy
 * engine converts to a deterministic pipeline action.
 */

import { env } from '$env/dynamic/private';
import type { JudgeGateProvider, GateEvaluationOptions, GateEvaluationResult } from './types';
import { GateVerdict } from './types';

/** Response format expected from the GPT-5.5 API. */
interface GptChatResponse {
  id: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string | null;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/** Structured response format the GPT-5.5 must produce. */
interface GptVerdictResponse {
  verdict: 'approve' | 'retry' | 'block' | 'escalate' | 'human_assist';
  confidence: number;
  reasoning: string;
  details?: string;
}

/**
 * Maps reasoning effort levels to the OpenAI `reasoning_effort` parameter.
 * 'low' → tokens are limited (~512), minimal reasoning.
 * 'medium' → moderate reasoning (~2048 tokens).
 * 'high' → maximum reasoning (~8192 tokens).
 */
function mapReasoningEffort(effort?: 'low' | 'medium' | 'high'): string | undefined {
  switch (effort) {
    case 'high': return 'high';
    case 'medium': return 'medium';
    case 'low': return 'low';
    default: return undefined; // let the API default
  }
}

function getApiConfig() {
  const apiKey = env.OPENAI_API_KEY;
  const baseUrl = env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const model = env.GPT55_MODEL || 'gpt-5.5';

  return { apiKey, baseUrl, model };
}

/**
 * OpenAI GPT-5.5 Judge Gate Provider.
 *
 * Uses direct `fetch()` — no OpenAI SDK dependency.
 */
export class OpenAiGpt55JudgeProvider implements JudgeGateProvider {
  readonly modelId: string;

  constructor(modelId?: string) {
    this.modelId = modelId || getApiConfig().model;
  }

  async evaluate(
    systemPrompt: string,
    content: string,
    opts?: GateEvaluationOptions
  ): Promise<GateEvaluationResult> {
    const { apiKey, baseUrl } = getApiConfig();

    if (!apiKey) {
      throw new Error('OpenAiGpt55JudgeProvider: Missing OPENAI_API_KEY environment variable');
    }

    const endpoint = `${baseUrl}/chat/completions`;
    const reasoningEffort = mapReasoningEffort(opts?.reasoningEffort);
    const temperature = opts?.temperature ?? 0.0;
    const maxTokens = opts?.maxTokens ?? 1024;
    const timeoutMs = opts?.timeoutMs ?? 30000;

    const body: Record<string, unknown> = {
      model: this.modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content }
      ],
      temperature,
      max_completion_tokens: maxTokens,
      response_format: { type: 'json_object' }
    };

    // Only add reasoning_effort if the model supports it (gpt-5.5+)
    if (reasoningEffort && this.modelId.includes('gpt-5.5')) {
      body.reasoning_effort = reasoningEffort;
    }

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), timeoutMs);

    try {
      console.info(`[gate:${this.modelId}] Evaluating gate content (${content.length} chars, effort=${reasoningEffort || 'default'})`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body),
        signal: abortController.signal
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '(unreadable)');
        throw new Error(`OpenAI API returned ${response.status}: ${errorBody.slice(0, 300)}`);
      }

      const data = await response.json<GptChatResponse>();
      const choice = data.choices?.[0];

      if (!choice?.message?.content) {
        throw new Error(`OpenAI returned empty response (finish_reason: ${choice?.finish_reason || 'unknown'})`);
      }

      // Parse structured verdict from model output
      let parsed: GptVerdictResponse;
      try {
        parsed = JSON.parse(choice.message.content) as GptVerdictResponse;
      } catch {
        throw new Error(`Failed to parse gate verdict JSON from model output: ${choice.message.content.slice(0, 200)}`);
      }

      // Validate verdict
      if (!Object.values(GateVerdict).includes(parsed.verdict as GateVerdict)) {
        throw new Error(`Invalid gate verdict: "${parsed.verdict}". Valid values: ${Object.values(GateVerdict).join(', ')}`);
      }

      const result: GateEvaluationResult = {
        verdict: parsed.verdict as GateVerdict,
        confidence: Math.max(0, Math.min(1, parsed.confidence ?? 0.5)),
        reasoning: parsed.reasoning || '(no reasoning provided)',
        details: parsed.details
      };

      if (opts?.includeUsage && data.usage) {
        result.usage = {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        };
      }

      console.info(`[gate:${this.modelId}] Verdict: ${result.verdict} (confidence: ${result.confidence})`);
      return result;
    } catch (err) {
      if (abortController.signal.aborted) {
        throw new Error(`OpenAI API request timed out after ${timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}

/** Singleton instance for convenience. */
export const gpt55Judge = new OpenAiGpt55JudgeProvider();
