// src/modules/backup/backup.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  StreamableFile,
  Header,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiSecurity,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { BackupService } from './backup.service';
import { CreateBackupDto } from './dto/create-backup.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('backup')
@Controller('backup')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class BackupController {
  constructor(private backups: BackupService) {}

  @Post(':databaseId')
  @ApiOperation({
    summary: 'Criar backup sob demanda',
    description: 'Rota para criar backups sob demanda',
  })
  @ApiCreatedResponse({ description: 'Backup criado com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  create(
    @Request() req: any,
    @Param('databaseId') dbId: string,
    @Body() dto: CreateBackupDto,
  ) {
    return this.backups.create(req.user.tenantId, dbId, dto);
  }

  @Get(':databaseId')
  @ApiOperation({
    summary: 'Listar backups',
    description: 'Rota para listar backups',
  })
  @ApiOkResponse({ description: 'Backups listados com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  findAll(@Request() req: any, @Param('databaseId') dbId: string) {
    return this.backups.findAll(req.user.tenantId, dbId);
  }

  @Post(':id/restore/:databaseId')
  @ApiOperation({
    summary: 'Restaurar backup',
    description: 'Rota para restaurar backups',
  })
  @ApiOkResponse({ description: 'Backup restaurado com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  restore(
    @Request() req: any,
    @Param('databaseId') dbId: string,
    @Param('id') id: string,
    @Body() body: { targetEnvironment?: string },
  ) {
    return this.backups.restore(req.user.tenantId, id, body.targetEnvironment);
  }
}
