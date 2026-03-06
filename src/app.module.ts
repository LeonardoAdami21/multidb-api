import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { appConfig } from './config/app.config';
import { DatabaseModule } from './modules/database/database.module';
import { AdaptersModule } from './modules/adapters/adapters.module';
import { BillingModule } from './modules/billing/billing.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    PrismaModule,
    AuthModule,
    DatabaseModule,
    AdaptersModule,
    BillingModule,
  ],
})
export class AppModule {}
