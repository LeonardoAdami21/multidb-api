// src/modules/query-engine/query-engine.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiSecurity,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiBody,
} from '@nestjs/swagger';
import { QueryEngineService } from './query-engine.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { ScopeGuard } from '../../common/guards/scope.guard';
import { RequireScope } from '../../common/decorators/scope.decorator';
import { QueryDto } from './dto/create-query-engine.dto';

@ApiTags('data')
@ApiSecurity('ApiKey')
@UseGuards(ApiKeyGuard)
@Controller('data')
export class QueryEngineController {
  constructor(private engine: QueryEngineService) {}

  @Get('')
  @RequireScope('db:read')
  @UseGuards(ScopeGuard)
  @ApiOperation({
    summary: 'Listar registros com filtros e paginação',
    description:
      'Rota que retorna uma lista de registros com filtros e paginação.',
  })
  @ApiParam({
    name: 'model',
    description: 'Modelo do banco de dados',
    required: true,
  })
  @ApiParam({
    name: 'databaseId',
    description: 'ID do banco de dados',
    required: true,
  })
  @ApiOkResponse({
    description: 'Retorna uma lista de registros',
  })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  @ApiQuery({ type: QueryDto })
  findMany(
    @Request() req: any,
    @Param('databaseId') dbId: string,
    @Param('model') model: string,
    @Query() query: QueryDto,
  ) {
    return this.engine.findAll(
      req.user.tenantId,
      dbId,
      model,
      query,
      req.user.keyId,
    );
  }

  @Get('/count')
  @RequireScope('db:read')
  @UseGuards(ScopeGuard)
  @ApiOperation({
    summary: 'Contar registros',
    description: 'Rota que retorna a quantidade de registros',
  })
  @ApiParam({
    name: 'model',
    description: 'Modelo do banco de dados',
    required: true,
  })
  @ApiParam({
    name: 'databaseId',
    description: 'ID do banco de dados',
    required: true,
  })
  @ApiQuery({ type: QueryDto })
  @ApiOkResponse({ description: 'Retorna a quantidade de registros' })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  count(
    @Request() req: any,
    @Param('databaseId') dbId: string,
    @Param('model') model: string,
    @Query() query: QueryDto,
  ) {
    return this.engine.count(req.user.tenantId, dbId, model, query);
  }

  @Get(':id')
  @RequireScope('db:read')
  @UseGuards(ScopeGuard)
  @ApiOperation({ summary: 'Buscar registro por ID' })
  @ApiParam({
    name: 'model',
    description: 'Modelo do banco de dados',
    required: true,
  })
  @ApiParam({
    name: 'databaseId',
    description: 'ID do banco de dados',
    required: true,
  })
  @ApiParam({
    name: 'id',
    description: 'ID do registro',
    required: true,
  })
  @ApiQuery({ type: QueryDto })
  @ApiOkResponse({ description: 'Retorna um registro' })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  findOne(
    @Request() req: any,
    @Param('databaseId') dbId: string,
    @Param('model') model: string,
    @Param('id') id: string,
    @Query() query: QueryDto,
  ) {
    return this.engine.findOne(
      req.user.tenantId,
      dbId,
      model,
      id,
      query,
      req.user.keyId,
    );
  }

  @Post('')
  @RequireScope('db:write')
  @UseGuards(ScopeGuard)
  @ApiOperation({ summary: 'Criar registro' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        databaseId: { type: 'string' },
        model: { type: 'string' },
      },
    },
  })
  @ApiBody({ type: 'object', schema: { $ref: '#/definitions/QueryDto' } })
  @ApiOkResponse({ description: 'Retorna um registro criado' })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  create(
    @Request() req: any,
    @Body('databaseId') dbId: string,
    @Body('model') model: string,
    @Body() data: any,
  ) {
    return this.engine.create(
      req.user.tenantId,
      dbId,
      model,
      data,
      req.user.keyId,
    );
  }

  @Post('/bulk')
  @RequireScope('db:write')
  @UseGuards(ScopeGuard)
  @ApiOperation({ summary: 'Criar múltiplos registros' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        databaseId: { type: 'string' },
        model: { type: 'string' },
      },
    },
  })
  @ApiBody({ type: 'object', schema: { $ref: '#/definitions/QueryDto' } })
  @ApiOkResponse({ description: 'Retorna um registro criado' })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  bulkCreate(
    @Request() req: any,
    @Param('databaseId') dbId: string,
    @Param('model') model: string,
    @Body() body: { items: any[] },
  ) {
    return this.engine.bulkCreate(
      req.user.tenantId,
      dbId,
      model,
      body.items,
      req.user.keyId,
    );
  }

  @Patch(':id')
  @RequireScope('db:write')
  @UseGuards(ScopeGuard)
  @ApiOperation({ summary: 'Atualizar registro parcialmente (PATCH)' })
  @ApiParam({
    name: 'model',
    description: 'Modelo do banco de dados',
    required: true,
  })
  @ApiParam({
    name: 'databaseId',
    description: 'ID do banco de dados',
    required: true,
  })
  @ApiParam({
    name: 'id',
    description: 'ID do registro',
    required: true,
  })
  @ApiBody({ type: 'object', schema: { $ref: '#/definitions/QueryDto' } })
  @ApiOkResponse({ description: 'Retorna um registro atualizado' })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  update(
    @Request() req: any,
    @Param('databaseId') dbId: string,
    @Param('model') model: string,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.engine.update(
      req.user.tenantId,
      dbId,
      model,
      id,
      data,
      req.user.keyId,
    );
  }

  @Delete(':id')
  @RequireScope('db:delete')
  @UseGuards(ScopeGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar registro' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        databaseId: { type: 'string' },
        model: { type: 'string' },
      },
    },
  })
  @ApiParam({
    name: 'id',
    description: 'ID do registro',
    required: true,
  })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  @ApiOkResponse({ description: 'Retorna um registro deletado' })
  remove(
    @Request() req: any,
    @Body('databaseId') dbId: string,
    @Body('model') model: string,
    @Param('id') id: string,
  ) {
    return this.engine.delete(
      req.user.tenantId,
      dbId,
      model,
      id,
      req.user.keyId,
    );
  }
}
