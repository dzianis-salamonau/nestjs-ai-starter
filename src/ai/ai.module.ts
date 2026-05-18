import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OpenAiAdapter } from './adapters/openai.adapter';
import { AnthropicAdapter } from './adapters/anthropic.adapter';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { AiJobService } from '../queue/ai-job.service';
import { AiJobProcessor } from '../queue/ai-job.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'ai' }),
    WebhooksModule,
  ],
  controllers: [AiController],
  providers: [
    AiService,
    OpenAiAdapter,
    AnthropicAdapter,
    AiJobService,
    AiJobProcessor,
  ],
  exports: [AiService],
})
export class AiModule {}
