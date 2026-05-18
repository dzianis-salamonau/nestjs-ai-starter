import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { ChatRequestDto, EnqueueChatDto } from './dto/chat.dto';
import { AiJobService } from '../queue/ai-job.service';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(
    private readonly ai: AiService,
    private readonly aiJobs: AiJobService,
  ) {}

  @Post('chat')
  @ApiOperation({ summary: 'Synchronous chat completion' })
  async chat(@Body() body: ChatRequestDto) {
    return this.ai.chat({
      messages: body.messages,
      provider: body.provider,
      model: body.model,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
    });
  }

  @Post('chat/async')
  @ApiOperation({
    summary: 'Enqueue chat job (BullMQ). Wire webhooks for completion.',
  })
  async chatAsync(@Body() body: EnqueueChatDto) {
    const jobId = await this.aiJobs.enqueueChat({
      messages: body.messages,
      provider: body.provider,
      model: body.model,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
      correlationId: body.correlationId,
    });
    return { jobId };
  }
}
