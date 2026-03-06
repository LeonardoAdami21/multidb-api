// src/modules/webhooks/webhooks.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWebhookDto } from '../dto/create-webhook.dto';
import type { Queue } from 'bull';

@Injectable()
export class WebhookRepository {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('webhooks') private queue: Queue,
  ) {}

  async create(tenantId: string, dto: CreateWebhookDto) {
    const secret = crypto.randomBytes(32).toString('hex');
    return this.prisma.webhook.create({
      data: { tenantId, ...dto, secret },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.webhook.findMany({ where: { tenantId } });
  }

  async delete(tenantId: string, id: string) {
    const hook = await this.prisma.webhook.findFirst({
      where: { id, tenantId },
    });
    if (!hook) throw new NotFoundException('Webhook not found');
    return this.prisma.webhook.delete({ where: { id } });
  }

  async getDeliveries(tenantId: string, webhookId: string) {
    const hook = await this.prisma.webhook.findFirst({
      where: { id: webhookId, tenantId },
    });
    if (!hook) throw new NotFoundException('Webhook not found');
    return this.prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async dispatch(tenantId: string, event: string, model: string, payload: any) {
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        tenantId,
        isActive: true,
        events: { has: event },
      },
    });

    for (const hook of webhooks) {
      if (hook.models.length > 0 && !hook.models.includes(model)) continue;

      const delivery = await this.prisma.webhookDelivery.create({
        data: { webhookId: hook.id, event, payload },
      });

      await this.queue.add(
        'deliver',
        {
          deliveryId: delivery.id,
          webhookId: hook.id,
          url: hook.url,
          secret: hook.secret,
          payload: {
            event,
            model,
            data: payload,
            timestamp: new Date().toISOString(),
          },
        },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: 100,
        },
      );
    }
  }
}
