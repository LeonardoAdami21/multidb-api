// src/adapters/mongodb.adapter.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoClient } from 'mongodb';
import { DatabaseAdapter } from './interface/IAdapter';

@Injectable()
export class MongodbAdapter implements DatabaseAdapter {
  private readonly logger = new Logger(MongodbAdapter.name);

  async provision(tenantId: string, name: string): Promise<string> {
    const dbName = `tenant_${tenantId.replace(/-/g, '_')}_${name}`;
    const baseUri = process.env.MONGODB_URI as string;

    // MongoDB creates database on first write — just validate connection
    const client = new MongoClient(baseUri);
    await client.connect();
    // Create a sentinel document to materialize the database
    const db = client.db(dbName);
    await db.collection('_meta').insertOne({ created: new Date(), tenantId });
    await client.close();

    this.logger.log(`Provisioned MongoDB database: ${dbName}`);
    return `${baseUri}/${dbName}`;
  }

  async initialize(connectionUrl: string): Promise<void> {
    const client = new MongoClient(connectionUrl);
    await client.connect();
    const db = client.db();
    // Create text index on _meta for search capabilities
    await db.collection('_meta').createIndex({ '$**': 'text' });
    await client.close();
  }

  async drop(
    connectionUrl: string,
    tenantId: string,
    name: string,
  ): Promise<void> {
    const client = new MongoClient(connectionUrl);
    await client.connect();
    await client.db().dropDatabase();
    await client.close();
    this.logger.log(`Dropped MongoDB database for tenant: ${tenantId}`);
  }

  async getSize(connectionUrl: string): Promise<bigint> {
    const client = new MongoClient(connectionUrl);
    await client.connect();
    const stats = await client.db().stats();
    await client.close();
    return BigInt(stats.dataSize + stats.indexSize);
  }

  async executeRaw(
    connectionUrl: string,
    query: string,
    params: any[] = [],
  ): Promise<any> {
    // MongoDB doesn't use SQL — parse as JSON command
    const client = new MongoClient(connectionUrl);
    await client.connect();
    const cmd = JSON.parse(query);
    const result = await client.db().command(cmd);
    await client.close();
    return result;
  }

  buildPrismaUrl(connectionUrl: string): string {
    return connectionUrl;
  }
}
