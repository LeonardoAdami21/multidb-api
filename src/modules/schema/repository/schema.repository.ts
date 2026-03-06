import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AdapterFactory } from 'src/modules/adapters/database-adapter.factory';
import { DatabaseService } from 'src/modules/database/database.service';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateSchemaDto } from '../dto/create-schema.dto';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PrismaSchemaBuilder } from '../prisma-schema.builder';

@Injectable()
export class SchemaRepository {
  private readonly logger = new Logger(SchemaRepository.name);
  constructor(
    private prisma: PrismaService,
    private databases: DatabaseService,
    private builder: PrismaSchemaBuilder,
    private adapters: AdapterFactory,
  ) {}

  async createSchema(
    tenantId: string,
    databaseId: string,
    dto: CreateSchemaDto,
  ) {
    const db = await this.databases.findOne(tenantId, databaseId);

    // Get next version
    const lastSchema = await this.prisma.dbSchema.findFirst({
      where: { databaseId },
      orderBy: { version: 'desc' },
    });
    const version = (lastSchema?.version ?? 0) + 1;

    // Build Prisma schema string from JSON definition
    const prismaSchema = this.builder.build(dto, db.engine);

    const schema = await this.prisma.dbSchema.create({
      data: {
        databaseId,
        version,
        definition: dto as any,
        prismaSchema,
        status: 'DRAFT',
      },
    });

    return schema;
  }

  async applySchema(tenantId: string, databaseId: string, schemaId: string) {
    const db = await this.databases.findOne(tenantId, databaseId);
    const schema = await this.prisma.dbSchema.findFirstOrThrow({
      where: { id: schemaId, databaseId },
    });

    if (schema.status === 'APPLIED') {
      throw new BadRequestException('Schema already applied');
    }

    const connectionUrl = await this.databases.getConnectionUrl(
      tenantId,
      databaseId,
    );

    // Write schema to temp dir and run prisma migrate
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'multidb-'));
    const schemaPath = path.join(tmpDir, 'schema.prisma');

    try {
      await this.prisma.dbSchema.update({
        where: { id: schemaId },
        data: { status: 'APPLIED' },
      });

      fs.writeFileSync(
        schemaPath,
        this.buildFullPrismaSchema(
          schema.prismaSchema,
          connectionUrl,
          db.engine as string,
        ),
      );

      // Run prisma db push (faster for dynamic schemas)
      execSync(
        `npx prisma db push --schema=${schemaPath} --skip-generate --accept-data-loss`,
        {
          env: { ...process.env, DATABASE_URL: connectionUrl },
          timeout: 60_000,
        },
      );

      await this.prisma.dbSchema.update({
        where: { id: schemaId },
        data: { status: 'APPLIED', appliedAt: new Date() },
      });

      this.logger.log(`Schema ${schemaId} applied to database ${databaseId}`);
      return { success: true, schemaId, version: schema.version };
    } catch (err) {
      await this.prisma.dbSchema.update({
        where: { id: schemaId },
        data: { status: 'FAILED' },
      });
      throw new BadRequestException(`Migration failed: ${err.message}`);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }

  async rollback(tenantId: string, databaseId: string, targetVersion: number) {
    const schemas = await this.prisma.dbSchema.findMany({
      where: { databaseId, status: 'APPLIED', version: { lte: targetVersion } },
      orderBy: { version: 'desc' },
    });
    if (!schemas.length)
      throw new NotFoundException('Target schema version not found');

    // Mark current schemas as rolled back
    await this.prisma.dbSchema.updateMany({
      where: { databaseId, version: { gt: targetVersion } },
      data: { status: 'ROLLED_BACK' },
    });

    // Re-apply target schema
    const targetSchema = schemas[0];
    const connectionUrl = await this.databases.getConnectionUrl(
      tenantId,
      databaseId,
    );
    const db = await this.databases.findOne(tenantId, databaseId);

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'multidb-'));
    const schemaPath = path.join(tmpDir, 'schema.prisma');

    try {
      fs.writeFileSync(
        schemaPath,
        this.buildFullPrismaSchema(
          targetSchema.prismaSchema,
          connectionUrl,
          db.engine as string,
        ),
      );
      execSync(
        `npx prisma db push --schema=${schemaPath} --skip-generate --force-reset`,
        {
          env: { ...process.env, DATABASE_URL: connectionUrl },
          timeout: 60_000,
        },
      );
      return { success: true, rolledBackToVersion: targetVersion };
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }

  async findAll(tenantId: string, databaseId: string) {
    await this.databases.findOne(tenantId, databaseId); // verify ownership
    return this.prisma.dbSchema.findMany({
      where: { databaseId },
      orderBy: { version: 'desc' },
    });
  }

  private buildFullPrismaSchema(
    modelsSchema: string,
    connectionUrl: string,
    engine: string,
  ): string {
    const providerMap: Record<string, string> = {
      POSTGRESQL: 'postgresql',
      MYSQL: 'mysql',
      MONGODB: 'mongodb',
      SQLITE: 'sqlite',
    };

    return `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${providerMap[engine] ?? 'postgresql'}"
  url      = "${connectionUrl}"
}

${modelsSchema}
    `.trim();
  }
}
