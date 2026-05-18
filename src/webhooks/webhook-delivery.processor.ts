import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import axios from 'axios';
import { createHmac } from 'crypto';
import { WebhookDeliveryJob } from './webhooks.service';

@Processor('webhooks')
export class WebhookDeliveryProcessor extends WorkerHost {
  private readonly log = new Logger(WebhookDeliveryProcessor.name);

  constructor() {
    super();
  }

  async process(job: Job<WebhookDeliveryJob>): Promise<void> {
    const { url, event, payload, signingSecret } = job.data;
    const body = JSON.stringify({ event, payload, ts: new Date().toISOString() });
    const sig = createHmac('sha256', signingSecret).update(body).digest('hex');

    try {
      const res = await axios.post(url, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': event,
          'X-Webhook-Signature': `sha256=${sig}`,
        },
        timeout: 10_000,
        validateStatus: () => true,
      });
      if (res.status < 200 || res.status >= 300) {
        throw new Error(`webhook responded ${res.status}`);
      }
    } catch (err) {
      this.log.warn(`Webhook delivery failed ${job.id}: ${String(err)}`);
      throw err;
    }
  }
}
