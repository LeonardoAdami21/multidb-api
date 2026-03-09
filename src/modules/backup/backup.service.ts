// src/modules/backup/backup.service.ts
import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateBackupDto } from './dto/create-backup.dto';
import { BackupRepository } from './repository/backup.repository';
import type { Queue } from 'bull';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(
    private readonly backupRepository: BackupRepository,
    private databases: DatabaseService,
    @InjectQueue('backups') private queue: Queue,
  ) {}

  async create(tenantId: string, databaseId: string, dto: CreateBackupDto) {
    const db = await this.databases.findOne(tenantId, databaseId);
    const backup = await this.backupRepository.create(
      tenantId,
      databaseId,
      dto,
    );
    await this.queue.add(
      'backup',
      { backupId: backup.id, tenantId, databaseId, engine: db.engine },
      { attempts: 3 },
    );
    return backup;
  }

  async findAll(tenantId: string, databaseId?: string) {
    const backups = await this.backupRepository.findAll(tenantId, databaseId);
    return backups;
  }

  async restore(tenantId: string, backupId: string, targetEnv?: string) {
    const backup = await this.backupRepository.restore(
      tenantId,
      backupId,
      targetEnv,
    );
    return { message: 'Restore job enqueued', backupId };
  }

  async scheduleAutomaticBackups(
    tenantId: string,
    databaseId: string,
    type: 'DAILY' | 'WEEKLY',
  ) {
    const db = await this.databases.findOne(tenantId, databaseId);
    const backup = await this.backupRepository.scheduleAutomaticBackups(
      tenantId,
      databaseId,
      type,
    );
    await this.queue.add(
      'backup',
      { backupId: backup.id, tenantId, databaseId, engine: db.engine },
      { attempts: 3 },
    );
    this.logger.log(`Scheduled ${type} backup for ${databaseId}`);
  }
}
