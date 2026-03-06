// src/adapters/postgresql.adapter.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseAdapter } from './interface/IAdapter';
import { Client } from 'pg';
@Injectable()
export class PostgresAdapter implements DatabaseAdapter {
  private readonly logger = new Logger(PostgresAdapter.name);

  constructor() {}

  async provision(tenantId: string, name: string): Promise<string> {
    const dbName = `tenant_${tenantId.replace(/-/g, '_')}_${name}`;
    const host = process.env.POSTGRES_HOST;
    const port = Number(process.env.POSTGRES_PORT) as number;
    const user = process.env.POSTGRES_USER;
    const password = process.env.POSTGRES_PASSWORD;

    const adminClient = new Client({
      host,
      port: port,
      user,
      password,
      database: 'postgres',
    });
    await adminClient.connect();
    await adminClient.query(`CREATE DATABASE "${dbName}"`);
    await adminClient.end();

    this.logger.log(`Provisioned PostgreSQL database: ${dbName}`);
    return `postgresql://${user}:${password}@${host}:${port}/${dbName}`;
  }

  async initialize(connectionUrl: string): Promise<void> {
    const client = new Client({ connectionString: connectionUrl });
    await client.connect();
    // Enable useful extensions
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await client.query('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');
    await client.end();
  }

  async drop(
    connectionUrl: string,
    tenantId: string,
    name: string,
  ): Promise<void> {
    const dbName = `tenant_${tenantId.replace(/-/g, '_')}_${name}`;
    const host = process.env.POSTGRES_HOST;
    const port = Number(process.env.POSTGRES_PORT) as number; //process.env.POSTGRES_PORT;
    const user = process.env.POSTGRES_USER;
    const password = process.env.POSTGRES_PASSWORD;

    const adminClient = new Client({
      host,
      port: port,
      user,
      password,
      database: 'postgres',
    });
    await adminClient.connect();
    // Terminate active connections first
    await adminClient.query(`
      SELECT pg_terminate_backend(pid) FROM pg_stat_activity
      WHERE datname = '${dbName}' AND pid <> pg_backend_pid()
    `);
    await adminClient.query(`DROP DATABASE IF EXISTS "${dbName}"`);
    await adminClient.end();
  }

  async getSize(connectionUrl: string): Promise<bigint> {
    const client = new Client({ connectionString: connectionUrl });
    await client.connect();
    const result = await client.query(
      'SELECT pg_database_size(current_database()) as size',
    );
    await client.end();
    return BigInt(result.rows[0].size);
  }

  async executeRaw(
    connectionUrl: string,
    query: string,
    params: any[] = [],
  ): Promise<any> {
    const client = new Client({ connectionString: connectionUrl });
    await client.connect();
    const result = await client.query(query, params);
    await client.end();
    return result.rows;
  }

  buildPrismaUrl(connectionUrl: string): string {
    return connectionUrl;
  }
}
