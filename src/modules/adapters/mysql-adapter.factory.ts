// src/adapters/mysql.adapter.ts
import { Injectable, Logger } from '@nestjs/common';
import * as mysql from 'mysql2/promise';
import { DatabaseAdapter } from './interface/IAdapter';

@Injectable()
export class MysqlAdapter implements DatabaseAdapter {
  private readonly logger = new Logger(MysqlAdapter.name);

  async provision(tenantId: string, name: string): Promise<string> {
    const dbName = `tenant_${tenantId.replace(/-/g, '_')}_${name}`;
    const host = process.env.MYSQL_HOST;
    const port = +(process.env.MYSQL_PORT, 10);
    const user = process.env.MYSQL_USER;
    const password = process.env.MYSQL_PASSWORD;

    const conn = await mysql.createConnection({ host, port, user, password });
    await conn.execute(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await conn.end();

    this.logger.log(`Provisioned MySQL database: ${dbName}`);
    return `mysql://${user}:${password}@${host}:${port}/${dbName}`;
  }

  async initialize(connectionUrl: string): Promise<void> {
    // MySQL database is created on first connection by Prisma — nothing to do
    const conn = await mysql.createConnection(connectionUrl);
    await conn.end();
  }

  async drop(
    connectionUrl: string,
    tenantId: string,
    name: string,
  ): Promise<void> {
    const dbName = `tenant_${tenantId.replace(/-/g, '_')}_${name}`;
    const host = process.env.MYSQL_HOST;
    const port = +(process.env.MYSQL_PORT, 10);
    const user = process.env.MYSQL_USER;
    const password = process.env.MYSQL_PASSWORD;

    const conn = await mysql.createConnection({ host, port, user, password });
    await conn.execute(`DROP DATABASE IF EXISTS \`${dbName}\``);
    await conn.end();
  }

  async getSize(connectionUrl: string): Promise<bigint> {
    const url = new URL(connectionUrl);
    const dbName = url.pathname.slice(1);
    const conn = await mysql.createConnection(connectionUrl);
    const [rows] = await conn.execute<any[]>(
      `SELECT SUM(data_length + index_length) AS size FROM information_schema.tables WHERE table_schema = ?`,
      [dbName],
    );
    await conn.end();
    return BigInt(rows[0]?.size ?? 0);
  }

  async executeRaw(
    connectionUrl: string,
    query: string,
    params: any[] = [],
  ): Promise<any> {
    const conn = await mysql.createConnection(connectionUrl);
    const [rows] = await conn.execute(query, params);
    await conn.end();
    return rows;
  }

  buildPrismaUrl(connectionUrl: string): string {
    return connectionUrl;
  }
}
