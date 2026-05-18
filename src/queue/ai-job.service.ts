import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { LlmMessage } from '../ai/interfaces/llm-message.interface';

export type AiChatJobPayload = {
  messages: LlmMessage[];
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  correlationId?: string;
};

@Injectable()
export class AiJobService {
  constructor(@InjectQueue('ai') private readonly aiQueue: Queue) {}

  async enqueueChat(payload: AiChatJobPayload): Promise<string> {
    const job = await this.aiQueue.add('chat', payload, {
      removeOnComplete: 1000,
      removeOnFail: 5000,
    });
    return String(job.id);
  }
}
