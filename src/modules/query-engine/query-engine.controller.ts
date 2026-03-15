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

  @Get(':databaseId/:model')
  @RequireScope('db:read')
  @UseGuards(ScopeGuard)
  @ApiOperation({
    summary: 'Listar registros com filtros e paginação',
    description:
      'Rota que retorna uma lista de registros com filtros e paginação.',
  })
  @ApiOkResponse({
    description: 'Retorna uma lista de registros',
  })
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

  @Get('/:databaseId/:model/count')
  @RequireScope('db:read')
  @UseGuards(ScopeGuard)
  @ApiOperation({
    summary: 'Contar registros',
    description: 'Rota que retorna a quantidade de registros',
  })
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

  @Get(':databaseId/:model/:id')
  @RequireScope('db:read')
  @UseGuards(ScopeGuard)
  @ApiOperation({ summary: 'Buscar registro por ID' })
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

  @Post('/:databaseId/:model')
  @RequireScope('db:write')
  @UseGuards(ScopeGuard)
  @ApiOperation({ summary: 'Criar registro' })
  create(
    @Request() req: any,
    @Param('databaseId') dbId: string,
    @Param('model') model: string,
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

  @Post('/:databaseId/:model/bulk')
  @RequireScope('db:write')
  @UseGuards(ScopeGuard)
  @ApiOperation({ summary: 'Criar múltiplos registros' })
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

  @Patch(':databaseId/:model/:id')
  @RequireScope('db:write')
  @UseGuards(ScopeGuard)
  @ApiOperation({ summary: 'Atualizar registro parcialmente (PATCH)' })
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

  @Delete(':databaseId/:model/:id')
  @RequireScope('db:delete')
  @UseGuards(ScopeGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar registro' })
  remove(
    @Request() req: any,
    @Param('databaseId') dbId: string,
    @Param('model') model: string,
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
