// src/modules/sdk-generator/sdk-generator.controller.ts
import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  Header,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiSecurity,
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { SdkGeneratorService } from './sdk-generator.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('sdk')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'databases/:databaseId/sdk' })
export class SdkGeneratorController {
  constructor(private sdkGen: SdkGeneratorService) {}

  @Get('typescript')
  @Header('Content-Type', 'application/typescript')
  @Header('Content-Disposition', 'attachment; filename="multidb-client.ts"')
  @ApiOperation({
    summary: 'Gerar SDK TypeScript para o schema atual',
    description: 'Rota para baixar o SDK TypeScript',
  })
  @ApiOkResponse({ description: 'Arquivo baixado com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Usuário não autenticado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  typescript(@Request() req: any, @Param('databaseId') dbId: string) {
    return this.sdkGen.generateTypeScript(req.user.tenantId, dbId);
  }

  @Get('openapi')
  @ApiOperation({
    summary: 'Gerar OpenAPI 3.0 spec para o schema atual',
    description: 'Rota para baixar o OpenAPI 3.0 spec',
  })
  @ApiOkResponse({ description: 'Arquivo baixado com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Usuário não autenticado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  openapi(@Request() req: any, @Param('databaseId') dbId: string) {
    return this.sdkGen.generateOpenApiSpec(req.user.tenantId, dbId);
  }
}
