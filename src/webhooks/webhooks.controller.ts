import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { createHmac, timingSafeEqual } from 'crypto';
import { Public } from '../common/decorators/public.decorator';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';

function safeEqualHex(a: string, b: string) {
  try {
    const ba = Buffer.from(a, 'utf8');
    const bb = Buffer.from(b, 'utf8');
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

@ApiTags('webhooks')
@ApiBearerAuth()
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Post()
  create(@Body() body: CreateWebhookDto) {
    return this.webhooks.register(body.url, body.events);
  }

  @Get()
  list() {
    return this.webhooks.list();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return { removed: this.webhooks.remove(id) };
  }

  @Public()
  @Post('inbound')
  @ApiHeader({ name: 'x-inbound-signature', required: false })
  async inbound(
    @Headers('x-inbound-signature') signature: string | undefined,
    @Body() body: unknown,
  ) {
    const secret = process.env.WEBHOOK_INBOUND_SECRET;
    if (secret) {
      const raw = JSON.stringify(body ?? {});
      const expected = createHmac('sha256', secret).update(raw).digest('hex');
      const received = signature?.replace(/^sha256=/, '') ?? '';
      if (!safeEqualHex(received, expected)) {
        throw new UnauthorizedException('invalid inbound signature');
      }
    }
    return { ok: true, received: body };
  }
}
