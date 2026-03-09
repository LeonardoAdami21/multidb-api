import { Module } from '@nestjs/common';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BackupRepository } from './repository/backup.repository';
import { DatabaseService } from '../database/database.service';
import { AdaptersModule } from '../adapters/adapters.module';
import { BullModule } from '@nestjs/bull';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    PrismaModule,
    AdaptersModule,
    DatabaseModule,
    BullModule.registerQueue({ name: 'backups' }),
  ],
  controllers: [BackupController],
  providers: [BackupService, BackupRepository],
})
export class BackupModule {}
