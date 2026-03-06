import { Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { BullModule } from '@nestjs/bull';
import { WebhookRepository } from './repository/webhook.repository';
import { WebhookProcessor } from './webhook.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'webhooks' })],
  controllers: [WebhookController],
  providers: [WebhookService, WebhookRepository, WebhookProcessor],
  exports: [WebhookService],
})
export class WebhookModule {}
