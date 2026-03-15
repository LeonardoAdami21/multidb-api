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
import { TenantModule } from './modules/tenant/tenant.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { CrudGeneratorModule } from './modules/crud-generator/crud-generator.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    AuthModule,
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 100 },
      { name: 'long', ttl: 60000, limit: 500 },
    ]),
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: +(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
        },
      }),
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    DatabaseModule,
    AdaptersModule,
    BillingModule,
    SchemaModule,
    CrudGeneratorModule,
    WebhookModule,
    QueryEngineModule,
    BackupModule,
    MetricsModule,
    SdkGeneratorModule,
    TenantModule
  ],
})
export class AppModule {}
