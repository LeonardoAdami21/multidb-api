// src/modules/billing/usage-tracker.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsageTracker {
  constructor(private prisma: PrismaService) {}

  async incrementRequests(tenantId: string, count = 1) {
    const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    await this.prisma.usageRecord
      .upsert({
        where: { tenantId_period: { tenantId, period } },
        create: { tenantId, period, requests: count },
        update: { requests: { increment: count } },
      })
      .catch(() => {}); // Fire-and-forget
  }
}
