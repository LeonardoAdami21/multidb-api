import { Injectable } from '@nestjs/common';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { WebhookRepository } from './repository/webhook.repository';

@Injectable()
export class WebhookService {
  constructor(private readonly webhookRepository: WebhookRepository) {}

  async create(tenantId: string, dto: CreateWebhookDto) {
    const webhook = await this.webhookRepository.create(tenantId, dto);
    return {
      id: webhook.id,
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      models: webhook.models,
    };
  }

  async findAll(tenantId: string) {
    const webhooks = await this.webhookRepository.findAll(tenantId);
    return webhooks.map((webhook) => ({
      id: webhook.id,
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      models: webhook.models,
    }));
  }

  async delete(tenantId: string, id: string) {
    return this.webhookRepository.delete(tenantId, id);
  }

  async getDeliveries(tenantId: string, webhookId: string) {
    const deliveries = await this.webhookRepository.getDeliveries(
      tenantId,
      webhookId,
    );
    return deliveries.map((delivery) => ({
      id: delivery.id,
      event: delivery.event,
      payload: delivery.payload,
      timestamp: delivery.createdAt,
    }));
  }

  async dispatch(tenantId: string, event: string, model: string, payload: any) {
    const result = await this.webhookRepository.dispatch(
      tenantId,
      event,
      model,
      payload,
    );
    return result
  }
}
