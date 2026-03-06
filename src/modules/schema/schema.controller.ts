// src/modules/schema-engine/schema-engine.controller.ts
import {
  Controller,
  Get,
  Post,
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
import { CreateSchemaDto } from './dto/create-schema.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SchemaService } from './schema.service';

@ApiTags('schema')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'database/:databaseId/schema' })
export class SchemaEngineController {
  constructor(private engine: SchemaService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar nova versão de schema',
    description: 'Rota para criar uma nova versão de schema',
  })
  @ApiCreatedResponse({ description: 'Schema criado com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao criar schema' })
  @ApiUnauthorizedResponse({ description: 'Usuário não autorizado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  create(
    @Request() req: any,
    @Param('databaseId') dbId: string,
    @Body() dto: CreateSchemaDto,
  ) {
    return this.engine.create(req.user.tenantId, dbId, dto);
  }

  @Post(':id/apply')
  @ApiOperation({
    summary: 'Aplicar schema (rodar migration)',
    description: 'Rota para aplicar um schema (rodar migration)',
  })
  @ApiCreatedResponse({ description: 'Schema aplicado com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao aplicar schema' })
  @ApiUnauthorizedResponse({ description: 'Usuário não autorizado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  apply(
    @Request() req: any,
    @Param('databaseId') dbId: string,
    @Param('id') id: string,
  ) {
    return this.engine.applySchema(req.user.tenantId, dbId, id);
  }

  @Post('rollback/:version')
  @ApiOperation({
    summary: 'Rollback para versão anterior',
    description: 'Rota para rollback para versão anterior',
  })
  @ApiCreatedResponse({ description: 'Rollback realizado com sucesso' })
  @ApiBadRequestResponse({ description: 'Erro ao realizar rollback' })
  @ApiUnauthorizedResponse({ description: 'Usuário não autorizado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  rollback(
    @Request() req: any,
    @Param('databaseId') dbId: string,
    @Param('version') version: number,
  ) {
    return this.engine.rollback(req.user.tenantId, dbId, version);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar versões de schema',
    description: 'Rota para listar todas as versões de schema',
  })
  @ApiOkResponse({ description: 'Listagem de schemas realizada com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Usuário não autorizado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  findAll(@Request() req: any, @Param('databaseId') dbId: string) {
    return this.engine.findAll(req.user.tenantId, dbId);
  }
}
