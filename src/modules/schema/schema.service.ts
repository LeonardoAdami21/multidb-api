import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateSchemaDto } from './dto/create-schema.dto';
import { UpdateSchemaDto } from './dto/update-schema.dto';
import { PrismaService } from '../prisma/prisma.service';
import { DatabaseService } from '../database/database.service';
import { PrismaSchemaBuilder } from './prisma-schema.builder';
import { SchemaRepository } from './repository/schema.repository';

@Injectable()
export class SchemaService {
  constructor(
    private readonly schemaRepository: SchemaRepository,
    private readonly databases: DatabaseService,
    private readonly builder: PrismaSchemaBuilder,
  ) {}
  async create(tenantId: string, databaseId: string, dto: CreateSchemaDto) {
    const db = await this.databases.findOne(tenantId, databaseId);
    const prismaSchema = this.builder.build(dto, db.engine);
    if (prismaSchema) {
      throw new BadRequestException('Schema already exists');
    }
    const schema = await this.schemaRepository.createSchema(
      tenantId,
      databaseId,
      dto,
    );
    return schema;
  }

  async findAll(tenantId: string, databaseId: string) {
    const schemas = await this.schemaRepository.findAll(tenantId, databaseId);
    return schemas;
  }

  async applySchema(tenantId: string, databaseId: string, schemaId: string) {
    const schema = await this.schemaRepository.applySchema(
      tenantId,
      databaseId,
      schemaId,
    );
    return schema;
  }

  async rollback(tenantId: string, databaseId: string, targetVersion: number) {
    const schema = await this.schemaRepository.rollback(
      tenantId,
      databaseId,
      targetVersion,
    );
    return schema;
  }
}
