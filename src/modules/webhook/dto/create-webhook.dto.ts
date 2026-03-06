// src/modules/webhooks/dto/create-webhook.dto.ts
import { IsArray, IsEnum, IsString, IsUrl, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const WEBHOOK_EVENTS = [
  'record.created',
  'record.updated',
  'record.deleted',
  'schema.migrated',
  'backup.completed',
  'quota.warning',
] as const;

export class CreateWebhookDto {
  @ApiProperty({ example: 'My Webhook', description: 'Webhook name', minLength: 2 })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'https://myapp.com/webhook', description: 'Webhook URL' })
  @IsUrl()
  url: string;

  @ApiProperty({ enum: WEBHOOK_EVENTS, isArray: true, description: 'Webhook events' })
  @IsArray()
  @IsEnum(WEBHOOK_EVENTS, { each: true })
  events: string[];

  @ApiProperty({
    description: 'Filter by model names. Empty = all models',
    required: false,
    example: ['Post', 'User'],
  })
  @IsArray()
  @IsString({ each: true })
  models: string[] = [];
}
