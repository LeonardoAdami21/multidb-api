import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CryptoService } from 'src/common/crypto.service';
import { AdapterFactory } from 'src/modules/adapters/database-adapter.factory';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateDatabaseDto } from '../dto/create-database.dto';
import { DbEngine } from '@prisma/client';
import { PLAN_LIMITS } from 'src/modules/billing/billing.constants';

@Injectable()
export class DatabaseRepository {
  private readonly logger = new Logger(DatabaseRepository.name);
  constructor(
    private prisma: PrismaService,
    private adapterFactory: AdapterFactory,
    private crypto: CryptoService,
  ) {}

  async create(tenantId: string, dto: CreateDatabaseDto) {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });

    // Enforce plan limits
    const count = await this.prisma.database.count({
      where: { tenantId, status: { not: 'DELETED' } },
    });
    const limit = PLAN_LIMITS[tenant.plan].databases;
    if (count >= limit) {
      throw new BadRequestException(
        `Plan ${tenant.plan} allows max ${limit} databases. Upgrade your plan.`,
      );
    }

    // Build connection URL based on engine
    const adapter = this.adapterFactory.get(dto.engine as DbEngine);
    const connectionUrl = await adapter.provision(tenantId, dto.name);
    const encryptedUrl = this.crypto.encrypt(connectionUrl);

    const db = await this.prisma.database.create({
      data: {
        tenantId,
        name: dto.name,
        engine: dto.engine as DbEngine,
        connectionUrl: encryptedUrl,
        status: 'PROVISIONING',
      },
    });

    // Run provisioning async
    this.runProvisioning(db.id, adapter, connectionUrl).catch((err) => {
      this.logger.error(`Provisioning failed for ${db.id}: ${err.message}`);
    });

    return db;
  }
  async findAll(tenantId: string) {
    const databases = await this.prisma.database.findMany({
      where: { tenantId, status: { not: 'DELETED' } },
      include: { _count: { select: { schemas: true, backups: true } } },
    });
    return databases;
  }

  async findOne(tenantId: string, id: string) {
    const db = await this.prisma.database.findFirst({
      where: { id, tenantId },
    });
    if (!db) throw new NotFoundException('Database not found');
    return db;
  }

  async delete(tenantId: string, id: string) {
    const db = await this.findOne(tenantId, id);
    const adapter = this.adapterFactory.get(db.engine);
    const connectionUrl = this.crypto.decrypt(db.connectionUrl);

    await adapter.drop(connectionUrl, tenantId, db.name);
    return this.prisma.database.update({
      where: { id },
      data: { status: 'DELETED' },
    });
  }

  private async runProvisioning(
    dbId: string,
    adapter: any,
    connectionUrl: string,
  ) {
    try {
      await adapter.initialize(connectionUrl);
      await this.prisma.database.update({
        where: { id: dbId },
        data: { status: 'ACTIVE' },
      });
      this.logger.log(`Database ${dbId} provisioned successfully`);
    } catch (err) {
      await this.prisma.database.update({
        where: { id: dbId },
        data: { status: 'ERROR' },
      });
      throw err;
    }
  }
}
