import { env } from '$env/dynamic/private';

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  format?: 'json' | 'text';
  timeoutMs?: number;
}

export interface LlmResponse {
  content: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

function getLlmConfig() {
  const ollamaBaseUrl = env.OLLAMA_BASE_URL || 'https://api.ollama.ai';
  const openaiBaseUrl = env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const openaiApiKey = env.OPENAI_API_KEY;
  const ollamaApiKey = env.OLLAMA_API_KEY || openaiApiKey;
  const primaryModel = env.GPT_MODEL || 'gpt-5.5';
  const fallbackModel = env.OLLAMA_MODEL || 'kimi-k2.6:cloud';

  return { ollamaBaseUrl, openaiBaseUrl, openaiApiKey, ollamaApiKey, primaryModel, fallbackModel };
}

/** Route models to the correct API based on naming conventions. */
function resolveModelEndpoint(model: string) {
  const config = getLlmConfig();
  // OpenAI models start with 'gpt-' (e.g. 'gpt-5.5', 'gpt-4o')
  // Everything else (kimi, gemini, claude, etc.) goes to Ollama
  if (model.startsWith('gpt-')) {
    return { baseUrl: config.openaiBaseUrl, apiKey: config.openaiApiKey };
  }
  return { baseUrl: config.ollamaBaseUrl, apiKey: config.ollamaApiKey };
}

interface OpenAIChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export async function llmChat(messages: LlmMessage[], options: LlmOptions = {}): Promise<LlmResponse> {
  const config = getLlmConfig();
  let model = options.model || config.primaryModel;
  const { baseUrl, apiKey } = resolveModelEndpoint(model);

  if (!apiKey) {
    throw new Error(`LLM API key missing for model "${model}".`);
  }

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    authorization: `Bearer ${apiKey}`
  };

  const body = JSON.stringify({
    model,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 8192,
    ...options.format && { response_format: { type: 'json_object' } }
  });

  const timeoutMs = options.timeoutMs ?? 45000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${baseUrl.endsWith('/v1') ? '' : '/v1'}/chat/completions`, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`LLM request timed out after ${timeoutMs}ms`);
    }
    throw err;
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    const error = await response.text().catch(() => '');
    const isPrimaryModel = !options.model || model === config.primaryModel;
    const shouldFallback =
      isPrimaryModel &&
      (response.status === 404 || response.status === 429 || response.status >= 500 || error.includes('token'));

    if (shouldFallback && model === config.primaryModel) {
      console.warn(`[llm] ${model} unavailable — falling back to ${config.fallbackModel}`);
      return llmChat(messages, { ...options, model: config.fallbackModel });
    }

    throw new Error(`LLM request failed (${response.status}): ${error}`);
  }

  const data = (await response.json()) as OpenAIChatCompletionResponse;
  const choice = data.choices?.[0];

  if (!choice?.message?.content) {
    throw new Error('LLM returned empty response.');
  }

  return {
    content: choice.message.content,
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        }
      : undefined
  };
}

export async function llmComplete(prompt: string, options: LlmOptions = {}): Promise<LlmResponse> {
  return llmChat([{ role: 'user', content: prompt }], options);
}

export function isLlmConfigured(): boolean {
  const config = getLlmConfig();
  return Boolean(config.openaiApiKey || config.ollamaApiKey);
}
