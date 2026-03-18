// src/modules/tenants/tenants.controller.ts
import {
  Controller,
  Get,
  Patch,
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
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiProperty,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IsOptional, IsString } from 'class-validator';
import { TenantService } from './tenant.service';

class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Tenant name' })
  name?: string;
}

@UseGuards(JwtAuthGuard)
@ApiTags('tenant')
@Controller('tenant')
@ApiBearerAuth()
export class TenantController {
  constructor(private tenants: TenantService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Ver perfil do tenant atual',
    description: 'Rota para ver o perfil do tenant atual',
  })
  @ApiOkResponse({
    description: 'Perfil do tenant atual retornado com sucesso',
  })
  @ApiUnauthorizedResponse({
    description: 'Não autorizado',
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
  })
  me(@Request() req: any) {
    return this.tenants.findOne(req.user.tenantId);
  }

  @Patch('/me')
  @ApiOperation({
    summary: 'Atualizar perfil',
    description: 'Rota para atualizar o perfil',
  })
  @ApiOkResponse({ description: 'Perfil atualizado com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  update(@Request() req: any, @Body() dto: UpdateTenantDto) {
    return this.tenants.update(req.user.tenantId, dto);
  }

  @Get('me/alerts')
  @ApiOperation({
    summary: 'Ver alertas ativos',
    description: 'Rota para ver os alertas ativos',
  })
  @ApiOkResponse({ description: 'Alertas ativos retornados com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  alerts(@Request() req: any) {
    return this.tenants.getAlerts(req.user.tenantId);
  }

  @Patch('me/alerts/:id/resolve')
  @ApiOperation({
    summary: 'Resolver alerta',
    description: 'Rota para resolver um alerta',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do alerta',
  })
  @ApiOkResponse({ description: 'Alerta resolvido com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  resolveAlert(@Request() req: any, @Param('id') id: string) {
    return this.tenants.resolveAlert(req.user.tenantId, id);
  }
}
