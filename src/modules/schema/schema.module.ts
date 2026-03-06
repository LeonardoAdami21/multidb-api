import { Module } from '@nestjs/common';
import { SchemaService } from './schema.service';
import { SchemaController } from './schema.controller';
import { SchemaRepository } from './repository/schema.repository';
import { DatabaseModule } from '../database/database.module';
import { PrismaSchemaBuilder } from './prisma-schema.builder';
import { AdaptersModule } from '../adapters/adapters.module';

@Module({
  imports: [DatabaseModule, AdaptersModule],
  controllers: [SchemaController],
  providers: [SchemaService, SchemaRepository, PrismaSchemaBuilder],
  exports: [SchemaService],
})
export class SchemaModule {}
