// src/adapters/sqlite.adapter.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import { DatabaseAdapter } from './interface/IAdapter';

@Injectable()
export class SqliteAdapter implements DatabaseAdapter {
  private readonly logger = new Logger(SqliteAdapter.name);

  constructor(private config: ConfigService) {}

  private getDbPath(tenantId: string, name: string): string {
    const storagePath = this.config.get('SQLITE_STORAGE_PATH', '/data/sqlite');
    fs.mkdirSync(path.join(storagePath, tenantId), { recursive: true });
    return path.join(storagePath, tenantId, `${name}.db`);
  }

  async provision(tenantId: string, name: string): Promise<string> {
    const dbPath = this.getDbPath(tenantId, name);
    this.logger.log(`Provisioned SQLite database: ${dbPath}`);
    return `file:${dbPath}`;
  }

  async initialize(connectionUrl: string): Promise<void> {
    // SQLite file is created on first connection by Prisma — nothing to do
  }

  async drop(
    connectionUrl: string,
    tenantId: string,
    name: string,
  ): Promise<void> {
    const dbPath = this.getDbPath(tenantId, name);
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      this.logger.log(`Dropped SQLite database: ${dbPath}`);
    }
  }

  async getSize(connectionUrl: string): Promise<bigint> {
    const filePath = connectionUrl.replace('file:', '');
    if (!fs.existsSync(filePath)) return 0n;
    const stats = fs.statSync(filePath);
    return BigInt(stats.size);
  }

  async executeRaw(
    connectionUrl: string,
    query: string,
    params: any[] = [],
  ): Promise<any> {
    // Delegate to Prisma for SQLite raw queries
    throw new Error('Use Prisma client for SQLite raw queries');
  }

  buildPrismaUrl(connectionUrl: string): string {
    return connectionUrl;
  }
}
