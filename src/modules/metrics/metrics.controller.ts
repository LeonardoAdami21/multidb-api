// src/modules/metrics/metrics.controller.ts
import { Controller, Get, Header, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { MetricsService } from './metrics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('metrics')
@Controller("metrics")
export class MetricsController {
  constructor(
    private metrics: MetricsService,
    private prisma: PrismaService,
  ) {}

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiExcludeEndpoint()
  getPrometheus() {
    return this.metrics.getMetrics();
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Rota para checar o status da aplicação',
  })
  @ApiOkResponse({ description: 'Aplicação OK' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno da aplicação' })
  async health() {
    const checks: Record<string, any> = {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };

    // Check DB
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
      checks.status = 'degraded';
    }

    return checks;
  }

  @Get('v1/metrics/tenant')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Métricas do tenant',
    description: 'Rota para obter méticas do tenant',
  })
  @ApiOkResponse({ description: 'Métricas obtidas com sucesso' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno da aplicação' })
  async tenantMetrics(@Request() req: any) {
    const tenantId = req.user.tenantId;
    const [databases, recentLogs, backups] = await Promise.all([
      this.prisma.database.findMany({
        where: { tenantId, status: 'ACTIVE' },
        select: { id: true, name: true, engine: true, sizeBytes: true },
      }),
      this.prisma.auditLog.count({
        where: {
          tenantId,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.backup.count({ where: { tenantId, status: 'COMPLETED' } }),
    ]);

    return {
      tenantId,
      databases: databases.map((db) => ({
        ...db,
        sizeMb: Number(db.sizeBytes) / (1024 * 1024),
      })),
      activity: { requestsLast24h: recentLogs, completedBackups: backups },
    };
  }
}
