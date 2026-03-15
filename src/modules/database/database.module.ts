// src/modules/databases/databases.module.ts
import { Module } from '@nestjs/common';
import { CryptoService } from '../../common/crypto.service';
import { AdaptersModule } from '../adapters/adapters.module';
import { TenantFactory } from '../prisma/tenant.factory';
import { DatabaseController } from './database.controller';
import { DatabaseService } from './database.service';
import { DatabaseRepository } from './repository/database.repository';

@Module({
  imports: [AdaptersModule],
  providers: [
    DatabaseRepository,
    DatabaseService,
    TenantFactory,
    CryptoService,
  ],
  controllers: [DatabaseController],
  exports: [DatabaseService, TenantFactory],
})
export class DatabaseModule {}
