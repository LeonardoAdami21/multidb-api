// src/modules/query-engine/cache.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis;


  onModuleInit() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD,
      keyPrefix: 'multidb:cache:',
      lazyConnect: true,
    });

    this.redis.on('error', (err) => {
      this.logger.warn(`Redis error (cache degraded): ${err.message}`);
    });

    this.redis.connect().catch(() => {
      this.logger.warn('Redis not available — caching disabled');
    });
  }

  buildKey(tenantId: string, model: string, op: string, params: any): string {
    const hash = Buffer.from(JSON.stringify(params))
      .toString('base64')
      .slice(0, 16);
    return `${tenantId}:${model}:${op}:${hash}`;
  }

  async get(key: string): Promise<any | null> {
    try {
      const val = await this.redis.get(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch {
      // Degrade gracefully
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch {}
  }

  async invalidateModel(tenantId: string, model: string): Promise<void> {
    try {
      const pattern = `${tenantId}:${model}:*`;
      const keys = await this.redis.keys(`multidb:cache:${pattern}`);
      if (keys.length > 0) {
        // Remove prefix before deleting (ioredis adds keyPrefix)
        const stripped = keys.map((k) => k.replace('multidb:cache:', ''));
        await this.redis.del(...stripped);
      }
      this.logger.debug(
        `Invalidated ${keys.length} cache keys for ${tenantId}:${model}`,
      );
    } catch {}
  }

  async invalidateTenant(tenantId: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`multidb:cache:${tenantId}:*`);
      if (keys.length > 0) {
        const stripped = keys.map((k) => k.replace('multidb:cache:', ''));
        await this.redis.del(...stripped);
      }
    } catch {}
  }

  async getStats(tenantId: string): Promise<{ keys: number }> {
    try {
      const keys = await this.redis.keys(`multidb:cache:${tenantId}:*`);
      return { keys: keys.length };
    } catch {
      return { keys: 0 };
    }
  }
}
