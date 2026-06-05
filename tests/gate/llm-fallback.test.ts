import { describe, it, expect, vi, beforeEach } from 'vitest';
import { llmChat } from '../../src/lib/server/llm';

describe('LLM Fallback (Gates)', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.GATE_EVALUATION = 'true';
    process.env.GPT_MODEL = 'gpt-5.5';
    process.env.OLLAMA_MODEL = 'kimi-k2.6:cloud';
    process.env.OLLAMA_API_KEY = 'test-key';
  });

  it('falls back to kimi-k2.6:cloud when GPT-5.5 returns 429', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve('rate limited')
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'fallback success' } }],
          usage: {}
        })
      });

    global.fetch = mockFetch as any;

    const result = await llmChat([{ role: 'user', content: 'test' }]);

    expect(result.content).toBe('fallback success');
    expect(mockFetch).toHaveBeenCalledTimes(2);
    // Second call should use kimi-k2.6:cloud
    const secondCallBody = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(secondCallBody.model).toBe('kimi-k2.6:cloud');
  });

  it('does not fallback on explicit model override', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: () => Promise.resolve('rate limited')
    });

    global.fetch = mockFetch as any;

    await expect(
      llmChat([{ role: 'user', content: 'test' }], { model: 'custom-model' })
    ).rejects.toThrow();

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
