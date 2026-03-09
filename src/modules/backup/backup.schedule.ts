// src/modules/backup/backup.scheduler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BackupService } from './backup.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BackupScheduler {
  private readonly logger = new Logger(BackupScheduler.name);

  constructor(
    private prisma: PrismaService,
    private backups: BackupService,
  ) {}

  @Cron('0 2 * * *') // Daily at 02:00
  async runDailyBackups() {
    this.logger.log('Running daily backup job...');
    const tenants = await this.prisma.tenant.findMany({
      where: {
        status: 'ACTIVE',
        plan: { in: ['STARTER', 'PRO', 'ENTERPRISE'] },
      },
      include: { databases: { where: { status: 'ACTIVE' } } },
    });

    for (const tenant of tenants) {
      for (const db of tenant.databases) {
        try {
          await this.backups.scheduleAutomaticBackups(
            tenant.id,
            db.id,
            'DAILY',
          );
        } catch (err) {
          this.logger.error(`Daily backup failed for ${db.id}: ${err.message}`);
        }
      }
    }
  }

  @Cron('0 3 * * 0') // Weekly on Sunday at 03:00
  async runWeeklyBackups() {
    this.logger.log('Running weekly backup job...');
    const tenants = await this.prisma.tenant.findMany({
      where: { status: 'ACTIVE', plan: { in: ['PRO', 'ENTERPRISE'] } },
      include: { databases: { where: { status: 'ACTIVE' } } },
    });

    for (const tenant of tenants) {
      for (const db of tenant.databases) {
        try {
          await this.backups.scheduleAutomaticBackups(
            tenant.id,
            db.id,
            'WEEKLY',
          );
        } catch (err) {
          this.logger.error(
            `Weekly backup failed for ${db.id}: ${err.message}`,
          );
        }
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireOldBackups() {
    const result = await this.prisma.backup.updateMany({
      where: { expiresAt: { lt: new Date() }, status: 'COMPLETED' },
      data: { status: 'EXPIRED' },
    });
    if (result.count > 0) this.logger.log(`Expired ${result.count} backups`);
    else this.logger.log('No expired backups found');
    return result;
  }
}
