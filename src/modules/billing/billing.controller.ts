import {
  UseGuards,
  Controller,
  Get,
  Post,
  Body,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiSecurity,
  ApiOperation,
  ApiProperty,
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { BillingService } from './billing.service';
import { IsEnum } from 'class-validator';

class ChangePlanDto {
  @ApiProperty({ enum: ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'] })
  @IsEnum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE'])
  plan: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
}

@Controller('billing')
@ApiTags('billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private billing: BillingService) {}

  @Get('/usage')
  @ApiOperation({
    summary: 'Ver uso atual e quotas',
    description: 'Rota atual e as quotas',
  })
  @ApiOkResponse({ description: 'Retorna o uso atual e quotas' })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  getUsage(@Request() req: any) {
    return this.billing.getUsage(req.user.tenantId);
  }

  @Post('/plan')
  @ApiOperation({
    summary: 'Alterar plano',
    description: 'Rota para alterar o plano',
  })
  @ApiCreatedResponse({ description: 'Plano alterado com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  @ApiBadRequestResponse({ description: 'Plano inválido' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  changePlan(@Request() req: any, @Body() dto: ChangePlanDto) {
    return this.billing.changePlan(req.user.tenantId, dto.plan);
  }
}
