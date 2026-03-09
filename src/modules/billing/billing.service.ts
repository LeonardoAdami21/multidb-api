// src/modules/billing/billing.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PLAN_LIMITS, OVERAGE_PRICES } from './billing.constants';
import { CryptoService } from '../../common/crypto.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdapterFactory } from '../adapters/database-adapter.factory';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private prisma: PrismaService,
    private adapters: AdapterFactory,
    private crypto: CryptoService,
  ) {}

  async getUsage(tenantId: string) {
    const period = this.getCurrentPeriod();
    const [tenant, usage, databaseCount] = await Promise.all([
      this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
      this.prisma.usageRecord.findFirst({ where: { tenantId, period } }),
      this.prisma.database.count({ where: { tenantId, status: 'ACTIVE' } }),
    ]);

    const limits = PLAN_LIMITS[tenant.plan];
    const storageUsedMb = Number(usage?.storageBytes ?? 0) / (1024 * 1024);

    return {
      period,
      plan: tenant.plan,
      usage: {
        requests: {
          used: Number(usage?.requests ?? 0),
          limit: limits.requestsPerMonth,
        },
        storage: { usedMb: storageUsedMb, limitMb: limits.storageMb },
        databases: { used: databaseCount, limit: limits.databases },
      },
      overage: this.calculateOverage(tenant.plan, usage, databaseCount, limits),
    };
  }

  async changePlan(
    tenantId: string,
    newPlan: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE',
  ) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { plan: newPlan },
      select: { id: true, plan: true },
    });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async updateStorageMetrics() {
    const databases = await this.prisma.database.findMany({
      where: { status: 'ACTIVE' },
    });

    for (const db of databases) {
      try {
        const adapter = this.adapters.get(db.engine);
        const connectionUrl = this.crypto.decrypt(db.connectionUrl);
        const size = await adapter.getSize(connectionUrl);

        await this.prisma.database.update({
          where: { id: db.id },
          data: { sizeBytes: size },
        });

        // Update usage record
        const period = this.getCurrentPeriod();
        const totalStorage = await this.prisma.database.aggregate({
          where: { tenantId: db.tenantId, status: 'ACTIVE' },
          _sum: { sizeBytes: true },
        });

        await this.prisma.usageRecord.upsert({
          where: { tenantId_period: { tenantId: db.tenantId, period } },
          create: {
            tenantId: db.tenantId,
            period,
            storageBytes: totalStorage._sum.sizeBytes ?? 0n,
          },
          update: { storageBytes: totalStorage._sum.sizeBytes ?? 0n },
        });

        // Check storage alerts
        await this.checkStorageAlerts(db.tenantId);
      } catch (err) {
        this.logger.warn(`Storage update failed for ${db.id}: ${err.message}`);
      }
    }
  }

  private async checkStorageAlerts(tenantId: string) {
    const usage = await this.getUsage(tenantId);
    const pct =
      (usage.usage.storage.usedMb / (usage.usage.storage.limitMb || Infinity)) *
      100;

    if (pct >= 95) {
      await this.prisma.alert
        .upsert({
          where: { id: `storage-critical-${tenantId}` as any },
          create: {
            tenantId,
            type: 'STORAGE_CRITICAL',
            severity: 'CRITICAL',
            message: `Storage at ${pct.toFixed(1)}% of limit`,
          },
          update: { message: `Storage at ${pct.toFixed(1)}% of limit` },
        })
        .catch(() => {});
    } else if (pct >= 80) {
      await this.prisma.alert
        .create({
          data: {
            tenantId,
            type: 'STORAGE_WARNING',
            severity: 'WARNING',
            message: `Storage at ${pct.toFixed(1)}% of limit`,
          },
        })
        .catch(() => {});
    }
  }

  private calculateOverage(
    plan: string,
    usage: any,
    dbCount: number,
    limits: any,
  ) {
    if (plan === 'ENTERPRISE') return { total: 0, items: [] };
    const items: any[] = [];
    const requests = Number(usage?.requests ?? 0);
    const storageMb = Number(usage?.storageBytes ?? 0) / (1024 * 1024);

    if (requests > limits.requestsPerMonth) {
      const extra = requests - limits.requestsPerMonth;
      items.push({
        resource: 'requests',
        extra,
        cost: (extra / 10_000) * OVERAGE_PRICES.requestsPer10k,
      });
    }

    if (storageMb > limits.storageMb) {
      const extraGb = (storageMb - limits.storageMb) / 1024;
      items.push({
        resource: 'storage',
        extraGb,
        cost: extraGb * OVERAGE_PRICES.storagePerGbMonth,
      });
    }

    return { items, total: items.reduce((s, i) => s + i.cost, 0) };
  }

  getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}
