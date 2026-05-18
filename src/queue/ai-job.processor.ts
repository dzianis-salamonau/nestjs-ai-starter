import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AiService } from '../ai/ai.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { AiChatJobPayload } from './ai-job.service';

@Processor('ai')
export class AiJobProcessor extends WorkerHost {
  private readonly log = new Logger(AiJobProcessor.name);

  constructor(
    private readonly ai: AiService,
    private readonly webhooks: WebhooksService,
  ) {
    super();
  }

  async process(job: Job<AiChatJobPayload>): Promise<unknown> {
    this.log.debug(`AI job ${job.id} started`);
    const result = await this.ai.chat({
      messages: job.data.messages,
      provider: job.data.provider,
      model: job.data.model,
      temperature: job.data.temperature,
      maxTokens: job.data.maxTokens,
    });

    await this.webhooks.emitEvent('ai.chat.completed', {
      jobId: String(job.id),
      correlationId: job.data.correlationId,
      result,
    });

    return result;
  }
}
