// src/modules/backup/backup.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';

import { PrismaService } from '../../prisma/prisma.service';
import { DatabaseService } from 'src/modules/database/database.service';
import type { Queue } from 'bull';
import { PLAN_LIMITS } from 'src/modules/billing/billing.constants';
import { CreateBackupDto } from '../dto/create-backup.dto';

@Injectable()
export class BackupRepository {
  private readonly logger = new Logger(BackupRepository.name);

  constructor(
    private prisma: PrismaService,
    private databases: DatabaseService,
    @InjectQueue('backups') private queue: Queue,
  ) {}

  async create(tenantId: string, databaseId: string, dto: CreateBackupDto) {
    const db = await this.databases.findOne(tenantId, databaseId);
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });

    const limits = PLAN_LIMITS[tenant.plan];
    if (!limits.manualBackups) {
      throw new Error('Manual backups not available on Free plan');
    }

    const backup = await this.prisma.backup.create({
      data: {
        tenantId,
        databaseId,
        label: dto.label,
        type: 'MANUAL',
        status: 'PENDING',
      },
    });

    await this.queue.add(
      'backup',
      { backupId: backup.id, tenantId, databaseId, engine: db.engine },
      { attempts: 3 },
    );
    return backup;
  }

  async findAll(tenantId: string, databaseId?: string) {
    return this.prisma.backup.findMany({
      where: {
        tenantId,
        ...(databaseId && { databaseId }),
        status: { not: 'EXPIRED' },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async restore(tenantId: string, backupId: string, targetEnv?: string) {
    const backup = await this.prisma.backup.findFirst({
      where: { id: backupId, tenantId },
    });
    if (!backup) throw new NotFoundException('Backup not found');
    if (backup.status !== 'COMPLETED')
      throw new Error('Backup not completed yet');

    await this.queue.add(
      'restore',
      { backupId, tenantId, targetEnv },
      { attempts: 2 },
    );
    return { message: 'Restore job enqueued', backupId };
  }

  async scheduleAutomaticBackups(
    tenantId: string,
    databaseId: string,
    type: 'DAILY' | 'WEEKLY',
  ) {
    const db = await this.databases.findOne(tenantId, databaseId);
    const backup = await this.prisma.backup.create({
      data: { tenantId, databaseId, type, status: 'PENDING' },
    });
    const job = await this.queue.add(
      'backup',
      { backupId: backup.id, tenantId, databaseId, engine: db.engine },
      { attempts: 3 },
    );
    this.logger.log(`Scheduled ${type} backup for ${databaseId}`);
    return job;
  }
}
