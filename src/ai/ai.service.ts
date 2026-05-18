import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnthropicAdapter } from './adapters/anthropic.adapter';
import { OpenAiAdapter } from './adapters/openai.adapter';
import { AiProvider } from '../config/env.validation';
import {
  LlmChatInput,
  LlmChatOutput,
  LlmProvider,
} from './interfaces/llm-provider.interface';

@Injectable()
export class AiService implements OnModuleInit {
  private readonly log = new Logger(AiService.name);
  private providers = new Map<string, LlmProvider>();

  constructor(
    private readonly config: ConfigService,
    private readonly openAi: OpenAiAdapter,
    private readonly anthropic: AnthropicAdapter,
  ) {}

  onModuleInit() {
    this.registerIfKey('openai', 'OPENAI_API_KEY', this.openAi);
    this.registerIfKey('anthropic', 'ANTHROPIC_API_KEY', this.anthropic);

    const def =
      (this.config.get<string>('AI_DEFAULT_PROVIDER') as AiProvider) ??
      AiProvider.OPENHUB;

    if (def === AiProvider.OPENHUB) {
      this.log.log(
        `AI routing: openhub (prefers openai=${this.providers.has('openai')}, anthropic=${this.providers.has('anthropic')})`,
      );
    } else {
      this.log.log(`AI routing: fixed provider ${def}`);
    }
  }

  private registerIfKey(
    id: string,
    keyEnv: string,
    adapter: LlmProvider,
  ) {
    const v = this.config.get<string>(keyEnv);
    if (v && v.length > 0) {
      this.providers.set(id, adapter);
    }
  }

  private resolveProvider(
    explicit?: string,
  ): { id: string; impl: LlmProvider } {
    if (explicit) {
      const impl = this.providers.get(explicit);
      if (!impl) {
        throw new BadRequestException(
          `LLM provider "${explicit}" is not configured (missing API key?).`,
        );
      }
      return { id: explicit, impl };
    }

    const def =
      (this.config.get<string>('AI_DEFAULT_PROVIDER') as AiProvider) ??
      AiProvider.OPENHUB;

    if (def === AiProvider.OPENAI && this.providers.has('openai')) {
      return { id: 'openai', impl: this.providers.get('openai')! };
    }
    if (def === AiProvider.ANTHROPIC && this.providers.has('anthropic')) {
      return { id: 'anthropic', impl: this.providers.get('anthropic')! };
    }

    if (def === AiProvider.OPENHUB) {
      if (this.providers.has('openai')) {
        return { id: 'openai', impl: this.providers.get('openai')! };
      }
      if (this.providers.has('anthropic')) {
        return { id: 'anthropic', impl: this.providers.get('anthropic')! };
      }
    }

    throw new BadRequestException(
      'No LLM provider configured. Set OPENAI_API_KEY and/or ANTHROPIC_API_KEY.',
    );
  }

  async chat(
    input: LlmChatInput & { provider?: string },
  ): Promise<LlmChatOutput & { resolvedProvider: string }> {
    const { impl, id } = this.resolveProvider(input.provider);
    const out = await impl.chat(input);
    return { ...out, resolvedProvider: id };
  }
}
