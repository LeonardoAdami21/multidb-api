// src/modules/graphql-engine/graphql-engine.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ModelDefinition } from 'src/modules/schema/dto/create-schema.dto';

@Injectable()
export class GraphqlEngineRepository {
  constructor(private prisma: PrismaService) {}

  async buildSchemaSDL(tenantId: string, databaseId: string): Promise<string> {
    const schema = await this.prisma.dbSchema.findFirst({
      where: { databaseId, status: 'APPLIED' },
      orderBy: { version: 'desc' },
    });

    if (!schema) throw new NotFoundException('No applied schema found');

    const definition = schema.definition as any;
    const models: ModelDefinition[] = definition.models ?? [];

    const typeDefs = models.map((m) => this.buildTypeSDL(m)).join('\n\n');
    const queryDefs = models.map((m) => this.buildQueryDefs(m)).join('\n  ');
    const mutationDefs = models
      .map((m) => this.buildMutationDefs(m))
      .join('\n  ');
    const inputDefs = models.map((m) => this.buildInputTypes(m)).join('\n\n');

    return `
scalar DateTime
scalar JSON

${typeDefs}

${inputDefs}

type Query {
  ${queryDefs}
}

type Mutation {
  ${mutationDefs}
}
    `.trim();
  }

  private buildTypeSDL(model: ModelDefinition): string {
    const fields = model.fields.map((f) => {
      const gqlType = this.toGqlType(f.type);
      const required = f.required !== false ? '!' : '';
      return `  ${f.name}: ${gqlType}${required}`;
    });
    return `type ${model.name} {\n${fields.join('\n')}\n}`;
  }

  private buildInputTypes(model: ModelDefinition): string {
    const createFields = model.fields
      .filter((f) => !f.id && !f.autoincrement && !f.defaultNow && !f.updatedAt)
      .map((f) => {
        const gqlType = this.toGqlType(f.type);
        const required = f.required !== false ? '!' : '';
        return `  ${f.name}: ${gqlType}${required}`;
      });

    const updateFields = model.fields
      .filter((f) => !f.id && !f.autoincrement && !f.defaultNow && !f.updatedAt)
      .map((f) => `  ${f.name}: ${this.toGqlType(f.type)}`);

    return `input Create${model.name}Input {\n${createFields.join('\n')}\n}\n\ninput Update${model.name}Input {\n${updateFields.join('\n')}\n}`;
  }

  private buildQueryDefs(model: ModelDefinition): string {
    const name = model.name;
    const camel = name.charAt(0).toLowerCase() + name.slice(1);
    return `${camel}s(take: Int, skip: Int): [${name}!]!\n  ${camel}(id: ID!): ${name}\n  ${camel}sCount: Int!`;
  }

  private buildMutationDefs(model: ModelDefinition): string {
    const name = model.name;
    const camel = name.charAt(0).toLowerCase() + name.slice(1);
    return `create${name}(data: Create${name}Input!): ${name}!\n  update${name}(id: ID!, data: Update${name}Input!): ${name}!\n  delete${name}(id: ID!): ${name}!`;
  }

  private toGqlType(type: string): string {
    const map: Record<string, string> = {
      String: 'String',
      Int: 'Int',
      BigInt: 'String',
      Float: 'Float',
      Decimal: 'Float',
      Boolean: 'Boolean',
      DateTime: 'DateTime',
      Json: 'JSON',
      Bytes: 'String',
    };
    return map[type] ?? 'String';
  }
}
