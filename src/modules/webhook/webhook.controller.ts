// src/modules/webhooks/webhooks.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiSecurity,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

import { CreateWebhookDto } from './dto/create-webhook.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WebhookService } from './webhook.service';

@ApiTags('webhook')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('webhook')
export class WebhookController {
  constructor(private webhooks: WebhookService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar webhook',
    description: 'Rota para criar um webhook',
  })
  @ApiCreatedResponse({ description: 'Webhook criado com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao criar webhook' })
  @ApiUnauthorizedResponse({ description: 'Acesso negado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  create(@Request() req: any, @Body() dto: CreateWebhookDto) {
    return this.webhooks.create(req.user.tenantId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar webhooks',
    description: 'Rota para listar webhooks',
  })
  @ApiOkResponse({ description: 'Webhooks listados com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Acesso negado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  findAll(@Request() req: any) {
    return this.webhooks.findAll(req.user.tenantId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Deletar webhook',
    description: 'Rota para deletar um webhook',
  })
  @ApiOkResponse({ description: 'Webhook deletado com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Acesso negado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  delete(@Request() req: any, @Param('id') id: string) {
    return this.webhooks.delete(req.user.tenantId, id);
  }

  @Get(':id/deliveries')
  @ApiOperation({
    summary: 'Histórico de entregas do webhook',
    description: 'Rota para obter o histórico de entregas de um webhook',
  })
  @ApiOkResponse({ description: 'Histórico de entregas obtido com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Acesso negado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  deliveries(@Request() req: any, @Param('id') id: string) {
    return this.webhooks.getDeliveries(req.user.tenantId, id);
  }
}
