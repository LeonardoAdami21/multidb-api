// src/modules/sdk-generator/sdk-generator.service.ts
import { DatabaseService } from 'src/modules/database/database.service';
import { ModelDefinition } from 'src/modules/schema/dto/create-schema.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class SdkGeneratorService {
  constructor(
    private prisma: PrismaService,
    private databases: DatabaseService,
  ) {}

  async generateTypeScript(
    tenantId: string,
    databaseId: string,
  ): Promise<string> {
    const db = await this.databases.findOne(tenantId, databaseId);
    const schema = await this.prisma.dbSchema.findFirst({
      where: { databaseId, status: 'APPLIED' },
      orderBy: { version: 'desc' },
    });

    if (!schema)
      throw new NotFoundException('No applied schema found for this database');

    const definition = schema.definition as any;
    const models: ModelDefinition[] = definition.models ?? [];
    const apiBase = process.env.API_BASE_URL ?? 'https://api.multidb.io';

    const typeDefs = models.map((m) => this.generateModelType(m)).join('\n\n');
    const clientCode = models
      .map((m) => this.generateModelClient(m))
      .join('\n\n');

    return `// MultiDB SDK — Auto-generated for database: ${db.name}
// Engine: ${db.engine} | Generated: ${new Date().toISOString()}
// DO NOT EDIT MANUALLY — Regenerate via API

const API_BASE = '${apiBase}/api/v1';
const DATABASE_ID = '${databaseId}';

// ─── Type Definitions ─────────────────────────────────────

${typeDefs}

// ─── HTTP Client ─────────────────────────────────────────

class MultiDBHttp {
  constructor(private apiKey: string) {}

  private async request<T>(method: string, path: string, body?: any, params?: Record<string, any>): Promise<T> {
    const url = new URL(\`\${API_BASE}/data/\${DATABASE_ID}/\${path}\`);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

    const res = await fetch(url.toString(), {
      method,
      headers: { 'Content-Type': 'application/json', 'X-API-Key': this.apiKey },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message ?? \`HTTP \${res.status}\`);
    }

    return res.status === 204 ? undefined as T : res.json();
  }

  get<T>(path: string, params?: Record<string, any>) { return this.request<T>('GET', path, undefined, params); }
  post<T>(path: string, body: any) { return this.request<T>('POST', path, body); }
  patch<T>(path: string, body: any) { return this.request<T>('PATCH', path, body); }
  delete<T>(path: string) { return this.request<T>('DELETE', path); }
}

// ─── Model Clients ────────────────────────────────────────

${clientCode}

// ─── Main Client ─────────────────────────────────────────

export class MultiDBClient {
  private http: MultiDBHttp;

${models.map((m) => `  readonly ${this.toCamel(m.name)}: ${m.name}Client;`).join('\n')}

  constructor(config: { apiKey: string }) {
    this.http = new MultiDBHttp(config.apiKey);
${models.map((m) => `    this.${this.toCamel(m.name)} = new ${m.name}Client(this.http);`).join('\n')}
  }
}

export default MultiDBClient;
`;
  }

  async generateOpenApiSpec(
    tenantId: string,
    databaseId: string,
  ): Promise<object> {
    const db = await this.databases.findOne(tenantId, databaseId);
    const schema = await this.prisma.dbSchema.findFirst({
      where: { databaseId, status: 'APPLIED' },
      orderBy: { version: 'desc' },
    });

    if (!schema) throw new NotFoundException('No applied schema found');
    const definition = schema.definition as any;
    const models: ModelDefinition[] = definition.models ?? [];

    const paths: Record<string, any> = {};
    const components: Record<string, any> = { schemas: {} };

    for (const model of models) {
      const tag = model.name;
      const basePath = `/api/v1/data/${databaseId}/${model.name}`;

      // Generate JSON Schema component
      components.schemas[model.name] = {
        type: 'object',
        properties: Object.fromEntries(
          model.fields.map((f) => [
            f.name,
            { type: this.toJsonSchemaType(f.type) },
          ]),
        ),
      };

      paths[basePath] = {
        get: {
          tags: [tag],
          summary: `List ${model.name}`,
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
          ],
          security: [{ ApiKey: [] }],
        },
        post: {
          tags: [tag],
          summary: `Create ${model.name}`,
          requestBody: {
            content: {
              'application/json': {
                schema: { $ref: `#/components/schemas/${model.name}` },
              },
            },
          },
          security: [{ ApiKey: [] }],
        },
      };

      paths[`${basePath}/{id}`] = {
        get: {
          tags: [tag],
          summary: `Get ${model.name} by ID`,
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          security: [{ ApiKey: [] }],
        },
        patch: {
          tags: [tag],
          summary: `Update ${model.name}`,
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          security: [{ ApiKey: [] }],
        },
        delete: {
          tags: [tag],
          summary: `Delete ${model.name}`,
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          security: [{ ApiKey: [] }],
        },
      };
    }

    return {
      openapi: '3.0.0',
      info: {
        title: `${db.name} API`,
        version: '1.0.0',
        description: `Auto-generated API for database: ${db.name}`,
      },
      servers: [
        { url: `${process.env.API_BASE_URL ?? 'https://api.multidb.io'}` },
      ],
      paths,
      components,
      security: [{ ApiKey: [] }],
      securitySchemes: {
        ApiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
      },
    };
  }

  private generateModelType(model: ModelDefinition): string {
    const fields = model.fields.map((f) => {
      const tsType = this.toTsType(f.type);
      const optional = f.required === false ? '?' : '';
      return `  ${f.name}${optional}: ${tsType};`;
    });

    return `export interface ${model.name} {\n${fields.join('\n')}\n}

export type Create${model.name}Input = Omit<${model.name}, 'id' | 'createdAt' | 'updatedAt'>;
export type Update${model.name}Input = Partial<Create${model.name}Input>;`;
  }

  private generateModelClient(model: ModelDefinition): string {
    const name = model.name;
    return `class ${name}Client {
  constructor(private http: MultiDBHttp) {}

  findMany(params?: { filter?: Record<string, any>; orderBy?: Record<string, 'asc'|'desc'>; page?: number; limit?: number; include?: string }): Promise<${name}[]> {
    return this.http.get<${name}[]>('${name}', params as any);
  }

  findOne(id: string | number, params?: { include?: string }): Promise<${name}> {
    return this.http.get<${name}>(\`${name}/\${id}\`, params as any);
  }

  count(filter?: Record<string, any>): Promise<{ count: number }> {
    return this.http.get<{ count: number }>(\`${name}/count\`, filter as any);
  }

  create(data: Create${name}Input): Promise<${name}> {
    return this.http.post<${name}>('${name}', data);
  }

  createMany(items: Create${name}Input[]): Promise<{ count: number }> {
    return this.http.post<{ count: number }>('${name}/bulk', { items });
  }

  update(id: string | number, data: Update${name}Input): Promise<${name}> {
    return this.http.patch<${name}>(\`${name}/\${id}\`, data);
  }

  delete(id: string | number): Promise<void> {
    return this.http.delete<void>(\`${name}/\${id}\`);
  }
}`;
  }

  private toTsType(type: string): string {
    const map: Record<string, string> = {
      String: 'string',
      Int: 'number',
      BigInt: 'bigint',
      Float: 'number',
      Decimal: 'number',
      Boolean: 'boolean',
      DateTime: 'Date',
      Json: 'any',
      Bytes: 'Buffer',
    };
    return map[type] ?? 'any';
  }

  private toJsonSchemaType(type: string): string {
    const map: Record<string, string> = {
      String: 'string',
      Int: 'integer',
      BigInt: 'integer',
      Float: 'number',
      Decimal: 'number',
      Boolean: 'boolean',
      DateTime: 'string',
      Json: 'object',
    };
    return map[type] ?? 'string';
  }

  private toCamel(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }
}
