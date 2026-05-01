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
  const baseUrl = env.OLLAMA_BASE_URL || 'https://api.ollama.ai';
  const apiKey = env.OLLAMA_API_KEY || env.OPENAI_API_KEY;
  const model = env.OLLAMA_MODEL || 'kimi-k2.6:cloud';

  return { baseUrl, apiKey, model };
}

export async function llmChat(messages: LlmMessage[], options: LlmOptions = {}): Promise<LlmResponse> {
  const config = getLlmConfig();
  const model = options.model || config.model;

  if (!config.apiKey) {
    throw new Error('OLLAMA_API_KEY or OPENAI_API_KEY is required.');
  }

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    authorization: `Bearer ${config.apiKey}`
  };

  const body = JSON.stringify({
    model,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 8192,
    ...options.format && { response_format: { type: 'json_object' } }
  });

  const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers,
    body
  });

  if (!response.ok) {
    const error = await response.text().catch(() => '');
    throw new Error(`LLM request failed (${response.status}): ${error}`);
  }

  const data = await response.json();
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
  return Boolean(config.apiKey && config.model);
}
