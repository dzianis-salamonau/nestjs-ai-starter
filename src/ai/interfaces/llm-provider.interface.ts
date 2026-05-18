import { LlmMessage } from './llm-message.interface';

export interface LlmChatInput {
  messages: LlmMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LlmChatOutput {
  text: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  raw?: unknown;
}

export interface LlmProvider {
  readonly id: string;
  chat(input: LlmChatInput): Promise<LlmChatOutput>;
}
