// src/adapters/adapters.module.ts
import { Module } from '@nestjs/common';
import { SqliteAdapter } from './sqlite.adapter';
import { AdapterFactory } from './database-adapter.factory';
import { PostgresAdapter } from './postgresql.adapter';
import { MysqlAdapter } from './mysql-adapter.factory';
import { MongodbAdapter } from './mongo-adapter.factory';

@Module({
  providers: [
    AdapterFactory,
    PostgresAdapter,
    MysqlAdapter,
    MongodbAdapter,
    SqliteAdapter,
  ],
  exports: [AdapterFactory],
})
export class AdaptersModule {}
