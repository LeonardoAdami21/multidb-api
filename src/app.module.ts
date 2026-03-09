import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { appConfig } from './config/app.config';
import { DatabaseModule } from './modules/database/database.module';
import { AdaptersModule } from './modules/adapters/adapters.module';
import { BillingModule } from './modules/billing/billing.module';
import { SchemaModule } from './modules/schema/schema.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { QueryEngineModule } from './modules/query-engine/query-engine.module';
import { BackupModule } from './modules/backup/backup.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { SdkGeneratorModule } from './modules/sdk-generator/sdk-generator.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    PrismaModule,
    AuthModule,
    DatabaseModule,
    AdaptersModule,
    BillingModule,
    SchemaModule,
    WebhookModule,
    QueryEngineModule,
    BackupModule,
    MetricsModule,
    SdkGeneratorModule,
  ],
})
export class AppModule {}
