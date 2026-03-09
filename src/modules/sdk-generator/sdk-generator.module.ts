import { Module } from '@nestjs/common';
import { SdkGeneratorService } from './sdk-generator.service';
import { SdkGeneratorController } from './sdk-generator.controller';
import { DatabaseModule } from '../database/database.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [DatabaseModule, PrismaModule],
  controllers: [SdkGeneratorController],
  providers: [SdkGeneratorService],
  exports: [SdkGeneratorService],
})
export class SdkGeneratorModule {}
