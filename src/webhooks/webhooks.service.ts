import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';

export type RegisteredWebhook = {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  createdAt: string;
};

export type WebhookDeliveryJob = {
  webhookId: string;
  url: string;
  event: string;
  payload: unknown;
  signingSecret: string;
};

@Injectable()
export class WebhooksService {
  private readonly hooks = new Map<string, RegisteredWebhook>();

  constructor(
    @InjectQueue('webhooks') private readonly q: Queue,
    private readonly config: ConfigService,
  ) {}

  register(url: string, events: string[]): RegisteredWebhook {
    const hook: RegisteredWebhook = {
      id: randomUUID(),
      url,
      events,
      createdAt: new Date().toISOString(),
    };
    this.hooks.set(hook.id, hook);
    return hook;
  }

  list(): RegisteredWebhook[] {
    return [...this.hooks.values()];
  }

  remove(id: string): boolean {
    return this.hooks.delete(id);
  }

  async emitEvent(event: string, payload: unknown) {
    const signingSecret = this.config.getOrThrow<string>('WEBHOOK_SIGNING_SECRET');
    for (const h of this.hooks.values()) {
      if (!h.events.includes(event) && !h.events.includes('*')) continue;
      await this.q.add(
        'deliver',
        {
          webhookId: h.id,
          url: h.url,
          event,
          payload,
          signingSecret,
        } satisfies WebhookDeliveryJob,
        { attempts: 5, backoff: { type: 'exponential', delay: 2000 } },
      );
    }
  }
}
