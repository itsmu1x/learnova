export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionOptions {
  temperature?: number;
  maxTokens?: number;
}

/**
 * Provider-agnostic AI contract. Concrete providers (OpenAI, Gemini, Claude)
 * implement `chat`; higher-level helpers compose prompts on top of it, so
 * swapping providers requires no changes to feature code.
 */
export interface AIService {
  readonly name: string;
  chat(messages: AIMessage[], options?: AICompletionOptions): Promise<string>;
}
