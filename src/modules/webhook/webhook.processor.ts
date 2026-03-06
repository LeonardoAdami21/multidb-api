// src/modules/webhooks/webhook.processor.ts
import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import * as crypto from 'crypto';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';


@Processor('webhooks')
export class WebhookProcessor {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(private prisma: PrismaService) {}

  @Process('deliver')
  async deliver(
    job: Job<{
      deliveryId: string;
      webhookId: string;
      url: string;
      secret: string;
      payload: any;
    }>,
  ) {
    const { deliveryId, url, secret, payload } = job.data;
    const body = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    try {
      const response = await axios.post(url, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-MultiDB-Signature': `sha256=${signature}`,
          'X-MultiDB-Event': payload.event,
          'User-Agent': 'MultiDB-Webhook/1.0',
        },
        timeout: 10_000,
      });

      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          statusCode: response.status,
          response: JSON.stringify(response.data).slice(0, 1000),
          success: true,
          attempts: job.attemptsMade + 1,
          deliveredAt: new Date(),
        },
      });

      this.logger.log(`Webhook delivered: ${deliveryId} → ${response.status}`);
    } catch (err) {
      const statusCode = err.response?.status ?? 0;
      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          statusCode,
          response: err.message.slice(0, 1000),
          success: false,
          attempts: job.attemptsMade + 1,
        },
      });

      this.logger.warn(
        `Webhook delivery failed (attempt ${job.attemptsMade + 1}): ${err.message}`,
      );
      throw err; // Triggers Bull retry
    }
  }
}
