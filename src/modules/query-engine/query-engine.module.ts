import { Module } from '@nestjs/common';
import { QueryEngineService } from './query-engine.service';
import { QueryEngineController } from './query-engine.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { QueryEngineRepository } from './repository/query-engine.repository';
import { CacheService } from './cache.service';
import { DatabaseModule } from '../database/database.module';
import { WebhookModule } from '../webhook/webhook.module';
import { ApiKeyService } from '../auth/api-key.service';

@Module({
  imports: [PrismaModule, AuditModule, DatabaseModule, WebhookModule],
  controllers: [QueryEngineController],
  providers: [
    QueryEngineService,
    QueryEngineRepository,
    CacheService,
    ApiKeyService,
  ],
  exports: [QueryEngineService],
})
export class QueryEngineModule {}
