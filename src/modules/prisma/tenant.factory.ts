// src/prisma/tenant.factory.ts
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { CryptoService } from 'src/common/crypto.service';

interface PoolEntry {
  client: PrismaClient;
  lastUsed: Date;
  tenantId: string;
}

@Injectable()
export class TenantFactory implements OnModuleDestroy {
  private readonly logger = new Logger(TenantFactory.name);
  private pool = new Map<string, PoolEntry>();
  private readonly IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 min

  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
  ) {
    // Clean idle connections every minute
    setInterval(() => this.cleanIdleConnections(), 60_000);
  }

  async getClient(tenantId: string, databaseId: string) {
    const poolKey = `${tenantId}:${databaseId}`;

    if (this.pool.has(poolKey)) {
      const entry = this.pool.get(poolKey)!;
      entry.lastUsed = new Date();
      return entry.client;
    }

    let db: any = await this.prisma.database.findFirst({
      where: { id: databaseId, tenantId, status: 'ACTIVE' },
    });

    const connectionUrl = this.crypto.decrypt(db.connectionUrl);
    const client = new PrismaClient({
      datasources: { db: { url: connectionUrl } },
      log: ['error', 'warn'],
    });

    await client.$connect();
    this.logger.log(`New connection pool entry: ${poolKey}`);

    this.pool.set(poolKey, { client, lastUsed: new Date(), tenantId });
    return client;
  }

  async disconnectTenant(tenantId: string, databaseId?: string) {
    for (const [key, entry] of this.pool.entries()) {
      if (
        entry.tenantId === tenantId &&
        (!databaseId || key.includes(databaseId))
      ) {
        await entry.client.$disconnect();
        this.pool.delete(key);
        this.logger.log(`Disconnected pool entry: ${key}`);
      }
    }
  }

  private async cleanIdleConnections() {
    const now = new Date();
    for (const [key, entry] of this.pool.entries()) {
      const idleMs = now.getTime() - entry.lastUsed.getTime();
      if (idleMs > this.IDLE_TIMEOUT_MS) {
        await entry.client.$disconnect();
        this.pool.delete(key);
        this.logger.log(`Evicted idle connection: ${key}`);
      }
    }
  }

  async onModuleDestroy() {
    for (const [, entry] of this.pool.entries()) {
      await entry.client.$disconnect();
    }
    this.pool.clear();
  }

  getPoolStats() {
    return {
      activeConnections: this.pool.size,
      entries: [...this.pool.entries()].map(([key, e]) => ({
        key,
        lastUsed: e.lastUsed,
      })),
    };
  }
}
