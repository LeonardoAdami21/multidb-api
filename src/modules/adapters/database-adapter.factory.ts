// src/adapters/database-adapter.interface.ts
// src/adapters/adapter.factory.ts
import { Injectable } from '@nestjs/common';
import { DbEngine } from '@prisma/client';
import { SqliteAdapter } from './sqlite.adapter';
import { PostgresAdapter } from './postgresql.adapter';
import { MysqlAdapter } from './mysql-adapter.factory';
import { MongodbAdapter } from './mongo-adapter.factory';
import { DatabaseAdapter } from './interface/IAdapter';

@Injectable()
export class AdapterFactory {
  private adapters: Map<DbEngine, DatabaseAdapter>;

  constructor(
    private postgres: PostgresAdapter,
    private mysql: MysqlAdapter,
    private mongodb: MongodbAdapter,
    private sqlite: SqliteAdapter,
  ) {
    this.adapters = new Map<DbEngine, any>();
    this.adapters.set(DbEngine.POSTGRESQL, this.postgres);
    this.adapters.set(DbEngine.MYSQL, this.mysql);
    this.adapters.set(DbEngine.MONGODB, this.mongodb);
    this.adapters.set(DbEngine.SQLITE, this.sqlite);
  }

  get(engine: DbEngine): DatabaseAdapter {
    const adapter = this.adapters.get(engine);
    if (!adapter) throw new Error(`No adapter found for engine: ${engine}`);
    return adapter;
  }
}
