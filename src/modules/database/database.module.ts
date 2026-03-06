// src/modules/databases/databases.module.ts
import { Module } from '@nestjs/common';
import { CryptoService } from '../../common/crypto.service';
import { DatabaseService } from './database.service';
import { TenantFactory } from '../prisma/tenant.factory';
import { DatabaseController } from './database.controller';
import { AdaptersModule } from '../adapters/adapters.module';
import { DatabaseRepository } from './repository/database.repository';

@Module({
  imports: [AdaptersModule],
  providers: [DatabaseService, DatabaseRepository, TenantFactory, CryptoService],
  controllers: [DatabaseController],
  exports: [DatabaseService, TenantFactory],
})
export class DatabaseModule {}
