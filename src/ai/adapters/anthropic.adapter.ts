import { BadRequestException, Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ConfigService } from '@nestjs/config';
import {
  LlmChatInput,
  LlmChatOutput,
  LlmProvider,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class AnthropicAdapter implements LlmProvider {
  readonly id = 'anthropic';
  private client?: Anthropic;

  constructor(private readonly config: ConfigService) {}

  private ensure(): Anthropic {
    if (!this.client) {
      const key = this.config.get<string>('ANTHROPIC_API_KEY');
      if (!key) {
        throw new BadRequestException('Anthropic is not configured');
      }
      this.client = new Anthropic({ apiKey: key });
    }
    return this.client;
  }

  private defaultModel() {
    return (
      this.config.get<string>('ANTHROPIC_MODEL') ?? 'claude-3-5-sonnet-20241022'
    );
  }

  async chat(input: LlmChatInput): Promise<LlmChatOutput> {
    const api = this.ensure();
    const model = input.model ?? this.defaultModel();
    const system = input.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n');
    const conversation = input.messages.filter((m) => m.role !== 'system');

    const res = await api.messages.create({
      model,
      max_tokens: input.maxTokens ?? 1024,
      temperature: input.temperature ?? 0.7,
      system: system || undefined,
      messages: conversation.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const text =
      res.content[0]?.type === 'text' ? res.content[0].text : '';

    return {
      text,
      provider: this.id,
      model: res.model,
      usage: {
        promptTokens: res.usage?.input_tokens,
        completionTokens: res.usage?.output_tokens,
        totalTokens:
          (res.usage?.input_tokens ?? 0) + (res.usage?.output_tokens ?? 0),
      },
      raw: res,
    };
  }
}
