import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { DatabaseService } from './database.service';
import { CreateDatabaseDto } from './dto/create-database.dto';

@Controller('database')
@ApiTags('database')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Post("")
  @ApiOperation({
    summary: 'Provisionar novo banco de dados',
    description: 'Rota para provisionar um novo banco de dados',
  })
  @ApiCreatedResponse({
    description: 'Banco de dados provisionado com sucesso',
  })
  @ApiBadRequestResponse({
    description: 'Requisição inválida',
  })
  @ApiUnauthorizedResponse({
    description: 'Usuário não autenticado',
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
  })
  create(@Request() req: any, @Body() dto: CreateDatabaseDto) {
    return this.databaseService.create(req.user.tenantId, dto);
  }

  @Get("")
  @ApiOperation({
    summary: 'Listar bancos de dados do tenant',
    description: 'Rota para listar todos os bancos de dados do tenant',
  })
  @ApiOkResponse({ description: 'Bancos de dados listados com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Usuário não autenticado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  findAll(@Request() req: any) {
    return this.databaseService.findAll(req.user.tenantId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar banco de dados por ID',
    description: 'Rota para buscar um banco de dados pelo ID',
  })
  @ApiOkResponse({ description: 'Banco de dados encontrado com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Usuário não autenticado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.databaseService.findOne(req.user.tenantId, id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Deletar banco de dados',
    description: 'Rota para deletar um banco de dados',
  })
  @ApiOkResponse({ description: 'Banco de dados deletado com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Usuário não autenticado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  delete(@Request() req: any, @Param('id') id: string) {
    return this.databaseService.delete(req.user.tenantId, id);
  }
}
