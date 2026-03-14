// src/modules/tenants/tenants.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantsRepository {
  constructor(private prisma: PrismaService) {}

  async findOne(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: { select: { databases: true, apiKeys: true, webhooks: true } },
      },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async update(tenantId: string, data: { name?: string }) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data,
    });
  }

  async delete(tenantId: string) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { status: 'DELETED' },
    });
  }

  async getAlerts(tenantId: string) {
    return this.prisma.alert.findMany({
      where: { tenantId, resolvedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveAlert(tenantId: string, alertId: string) {
    return this.prisma.alert.updateMany({
      where: { id: alertId, tenantId },
      data: { resolvedAt: new Date() },
    });
  }
}
