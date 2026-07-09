import { getEnv } from '@learnova/config';
import { InternalError } from '@learnova/shared';
import type { AICompletionOptions, AIMessage, AIService } from './types.js';

export class OpenAIProvider implements AIService {
  readonly name = 'openai';
  constructor(private readonly apiKey: string, private readonly model = 'gpt-4o-mini') {}

  async chat(messages: AIMessage[], options?: AICompletionOptions): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: options?.temperature ?? 0.4,
        max_tokens: options?.maxTokens ?? 800,
      }),
    });
    if (!res.ok) throw new InternalError(`OpenAI request failed (${res.status})`);
    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    return data.choices[0]?.message.content ?? '';
  }
}

export class GeminiProvider implements AIService {
  readonly name = 'gemini';
  constructor(private readonly apiKey: string, private readonly model = 'gemini-1.5-flash') {}

  async chat(messages: AIMessage[], options?: AICompletionOptions): Promise<string> {
    const system = messages.find((m) => m.role === 'system')?.content;
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
          generationConfig: {
            temperature: options?.temperature ?? 0.4,
            maxOutputTokens: options?.maxTokens ?? 800,
          },
        }),
      },
    );
    if (!res.ok) throw new InternalError(`Gemini request failed (${res.status})`);
    const data = (await res.json()) as {
      candidates?: { content: { parts: { text: string }[] } }[];
    };
    return data.candidates?.[0]?.content.parts.map((p) => p.text).join('') ?? '';
  }
}

export class ClaudeProvider implements AIService {
  readonly name = 'claude';
  constructor(
    private readonly apiKey: string,
    private readonly model = 'claude-3-5-sonnet-latest',
  ) {}

  async chat(messages: AIMessage[], options?: AICompletionOptions): Promise<string> {
    const system = messages.find((m) => m.role === 'system')?.content;
    const rest = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        system,
        messages: rest,
        max_tokens: options?.maxTokens ?? 800,
        temperature: options?.temperature ?? 0.4,
      }),
    });
    if (!res.ok) throw new InternalError(`Claude request failed (${res.status})`);
    const data = (await res.json()) as { content: { text: string }[] };
    return data.content.map((c) => c.text).join('');
  }
}

/**
 * Deterministic offline provider used when no API key is configured. Keeps the
 * whole AI surface functional in local/demo environments without external calls.
 */
export class MockProvider implements AIService {
  readonly name = 'mock';
  async chat(messages: AIMessage[]): Promise<string> {
    const last = [...messages].reverse().find((m) => m.role === 'user');
    const prompt = last?.content.slice(0, 240) ?? '';
    return [
      "Here's a concise, structured explanation:",
      '',
      `• Key idea — ${prompt}`,
      '• Think of it step by step and connect it to what you already know.',
      '• Try applying it in a small example to reinforce the concept.',
      '',
      '(This is a locally-generated response. Configure an AI provider key to enable live answers.)',
    ].join('\n');
  }
}

let cached: AIService | null = null;

export function getAIService(): AIService {
  if (cached) return cached;
  const env = getEnv();
  switch (env.AI_PROVIDER) {
    case 'openai':
      cached = env.OPENAI_API_KEY ? new OpenAIProvider(env.OPENAI_API_KEY) : new MockProvider();
      break;
    case 'gemini':
      cached = env.GEMINI_API_KEY ? new GeminiProvider(env.GEMINI_API_KEY) : new MockProvider();
      break;
    case 'claude':
      cached = env.ANTHROPIC_API_KEY ? new ClaudeProvider(env.ANTHROPIC_API_KEY) : new MockProvider();
      break;
    default:
      cached = new MockProvider();
  }
  return cached;
}
