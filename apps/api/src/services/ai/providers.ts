import { getEnv } from '@learnova/config';
import { InternalError } from '@learnova/shared';
import type { AICompletionOptions, AIMessage, AIService } from './types.js';

export class OpenAIProvider implements AIService {
  constructor(
    private readonly apiKey: string,
    private readonly model = 'gpt-4o-mini',
    // Any OpenAI-compatible chat-completions endpoint (e.g. Groq).
    private readonly baseUrl = 'https://api.openai.com/v1',
    readonly name = 'openai',
    // Provider-specific request fields (e.g. Groq's reasoning_effort).
    private readonly extraBody: Record<string, unknown> = {},
  ) {}

  async chat(messages: AIMessage[], options?: AICompletionOptions): Promise<string> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
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
        ...this.extraBody,
      }),
    });
    if (!res.ok) throw new InternalError(`${this.name} request failed (${res.status})`);
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
    case 'groq':
      cached = env.GROQ_API_KEY
        ? new OpenAIProvider(
            env.GROQ_API_KEY,
            env.GROQ_MODEL,
            'https://api.groq.com/openai/v1',
            'groq',
            // GPT-OSS thinks before answering, and that counts against max_tokens; keep it short
            // so replies aren't cut off. Only GPT-OSS accepts this field.
            env.GROQ_MODEL.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low' } : {},
          )
        : new MockProvider();
      break;
    default:
      cached = new MockProvider();
  }
  return cached;
}
