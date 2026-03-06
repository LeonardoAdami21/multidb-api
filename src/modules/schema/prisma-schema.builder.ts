// src/modules/schema-engine/prisma-schema.builder.ts
import { Injectable } from '@nestjs/common';
import { DbEngine } from '@prisma/client';
import {
  CreateSchemaDto,
  ModelDefinition,
  FieldDefinition,
} from './dto/create-schema.dto';

// Map abstract types to Prisma types per engine
const TYPE_MAP: Record<string, Record<DbEngine, string>> = {
  String: {
    POSTGRESQL: 'String',
    MYSQL: 'String',
    MONGODB: 'String',
    SQLITE: 'String',
  },
  Int: { POSTGRESQL: 'Int', MYSQL: 'Int', MONGODB: 'Int', SQLITE: 'Int' },
  BigInt: {
    POSTGRESQL: 'BigInt',
    MYSQL: 'BigInt',
    MONGODB: 'BigInt',
    SQLITE: 'BigInt',
  },
  Float: {
    POSTGRESQL: 'Float',
    MYSQL: 'Float',
    MONGODB: 'Float',
    SQLITE: 'Float',
  },
  Decimal: {
    POSTGRESQL: 'Decimal',
    MYSQL: 'Decimal',
    MONGODB: 'Float',
    SQLITE: 'Decimal',
  },
  Boolean: {
    POSTGRESQL: 'Boolean',
    MYSQL: 'Boolean',
    MONGODB: 'Boolean',
    SQLITE: 'Boolean',
  },
  DateTime: {
    POSTGRESQL: 'DateTime',
    MYSQL: 'DateTime',
    MONGODB: 'DateTime',
    SQLITE: 'DateTime',
  },
  Json: {
    POSTGRESQL: 'Json',
    MYSQL: 'Json',
    MONGODB: 'Json',
    SQLITE: 'String',
  },
  Bytes: {
    POSTGRESQL: 'Bytes',
    MYSQL: 'Bytes',
    MONGODB: 'Bytes',
    SQLITE: 'Bytes',
  },
};

@Injectable()
export class PrismaSchemaBuilder {
  build(dto: CreateSchemaDto, engine: DbEngine): string {
    return dto.models
      .map((model) => this.buildModel(model, engine))
      .join('\n\n');
  }

  private buildModel(model: ModelDefinition, engine: DbEngine): string {
    const fields = model.fields
      .map((f) => this.buildField(f, engine))
      .join('\n  ');

    const uniqueBlocks =
      model.uniqueConstraints
        ?.map((u) => `  @@unique([${u.fields.join(', ')}])`)
        .join('\n') ?? '';

    const indexBlocks =
      model.indexes
        ?.map((idx) => {
          const type = idx.type === 'FULLTEXT' ? ' type: Fulltext' : '';
          return `  @@index([${idx.fields.join(', ')}]${type ? `, map: "${idx.name}"` : ''})`;
        })
        .join('\n') ?? '';

    return [
      `model ${model.name} {`,
      `  ${fields}`,
      uniqueBlocks,
      indexBlocks,
      `}`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  private buildField(field: FieldDefinition, engine: DbEngine): string {
    const prismaType = TYPE_MAP[field.type]?.[engine] ?? field.type;
    const optional = field.required === false ? '?' : '';
    const list = field.isList ? '[]' : '';

    const attrs: string[] = [];

    if (field.id) attrs.push('@id');
    if (field.autoincrement) attrs.push('@default(autoincrement())');
    if (field.defaultUuid) attrs.push('@default(uuid())');
    if (field.defaultNow) attrs.push('@default(now())');
    if (
      field.default !== undefined &&
      !field.autoincrement &&
      !field.defaultNow &&
      !field.defaultUuid
    ) {
      const val =
        typeof field.default === 'string'
          ? `"${field.default}"`
          : field.default;
      attrs.push(`@default(${val})`);
    }
    if (field.unique) attrs.push('@unique');
    if (field.updatedAt) attrs.push('@updatedAt');
    if (field.relation) {
      attrs.push(`@relation(fields: [${field.name}Id], references: [id])`);
    }
    if (field.encrypted) {
      // Custom annotation for application-level encryption
      attrs.push('/// @encrypted');
    }

    const attrStr = attrs.length ? ' ' + attrs.join(' ') : '';
    return `${field.name} ${prismaType}${optional}${list}${attrStr}`;
  }
}
