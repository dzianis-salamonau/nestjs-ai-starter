import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  LlmChatInput,
  LlmChatOutput,
  LlmProvider,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class OpenAiAdapter implements LlmProvider {
  readonly id = 'openai';
  private client?: OpenAI;

  constructor(private readonly config: ConfigService) {}

  private ensure(): OpenAI {
    if (!this.client) {
      const key = this.config.get<string>('OPENAI_API_KEY');
      if (!key) {
        throw new BadRequestException('OpenAI is not configured');
      }
      this.client = new OpenAI({ apiKey: key });
    }
    return this.client;
  }

  private defaultModel() {
    return this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';
  }

  async chat(input: LlmChatInput): Promise<LlmChatOutput> {
    const api = this.ensure();
    const model = input.model ?? this.defaultModel();
    const res = await api.chat.completions.create({
      model,
      messages: input.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: input.temperature ?? 0.7,
      max_tokens: input.maxTokens,
    });

    const choice = res.choices[0];
    const text = choice?.message?.content ?? '';

    return {
      text,
      provider: this.id,
      model: res.model,
      usage: {
        promptTokens: res.usage?.prompt_tokens,
        completionTokens: res.usage?.completion_tokens,
        totalTokens: res.usage?.total_tokens,
      },
      raw: res,
    };
  }
}
