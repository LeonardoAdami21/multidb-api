// src/modules/backup/backup.processor.ts
import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PrismaService } from '../prisma/prisma.service';
import { AdapterFactory } from '../adapters/database-adapter.factory';
import { DatabaseService } from '../database/database.service';

@Processor('backups')
export class BackupProcessor {
  private readonly logger = new Logger(BackupProcessor.name);

  constructor(
    private prisma: PrismaService,
    private databases: DatabaseService,
    private adapters: AdapterFactory,
  ) {}

  @Process('backup')
  async runBackup(
    job: Job<{
      backupId: string;
      tenantId: string;
      databaseId: string;
      engine: string;
    }>,
  ) {
    const { backupId, tenantId, databaseId, engine } = job.data;

    await this.prisma.backup.update({
      where: { id: backupId },
      data: { status: 'IN_PROGRESS' },
    });

    try {
      const connectionUrl = await this.databases.getConnectionUrl(
        tenantId,
        databaseId,
      );
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'backup-'));
      const dumpFile = path.join(tmpDir, `${backupId}.dump`);

      // Engine-specific dump commands
      switch (engine) {
        case 'POSTGRESQL':
          execSync(`pg_dump "${connectionUrl}" -Fc -f "${dumpFile}"`, {
            timeout: 300_000,
          });
          break;
        case 'MYSQL': {
          const url = new URL(connectionUrl);
          execSync(
            `mysqldump -h${url.hostname} -P${url.port} -u${url.username} -p${url.password} ${url.pathname.slice(1)} > "${dumpFile}"`,
            { timeout: 300_000 },
          );
          break;
        }
        case 'MONGODB':
          execSync(
            `mongodump --uri="${connectionUrl}" --archive="${dumpFile}"`,
            { timeout: 300_000 },
          );
          break;
        case 'SQLITE': {
          const filePath = connectionUrl.replace('file:', '');
          fs.copyFileSync(filePath, dumpFile);
          break;
        }
      }

      const size = fs.statSync(dumpFile).size;
      const storagePath = process.env.BACKUP_STORAGE_PATH ?? '/data/backups';
      const destPath = path.join(storagePath, tenantId, `${backupId}.dump`);
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.renameSync(dumpFile, destPath);
      fs.rmSync(tmpDir, { recursive: true, force: true });

      // Calculate expiry (7 days default)
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await this.prisma.backup.update({
        where: { id: backupId },
        data: {
          status: 'COMPLETED',
          sizeBytes: size,
          storagePath: destPath,
          completedAt: new Date(),
          expiresAt,
        },
      });

      this.logger.log(`Backup ${backupId} completed (${size} bytes)`);
    } catch (err) {
      await this.prisma.backup.update({
        where: { id: backupId },
        data: { status: 'FAILED' },
      });
      this.logger.error(`Backup ${backupId} failed: ${err.message}`);
      throw err;
    }
  }
}
