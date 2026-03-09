import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { UsageTracker } from './usage-tracker.service';
import { AdapterFactory } from '../adapters/database-adapter.factory';
import { CryptoService } from 'src/common/crypto.service';
import { AdaptersModule } from '../adapters/adapters.module';

@Module({
  imports: [PrismaModule, AdaptersModule],
  controllers: [BillingController],
  providers: [BillingService, UsageTracker, CryptoService],
  exports: [BillingService],
})
export class BillingModule {}
