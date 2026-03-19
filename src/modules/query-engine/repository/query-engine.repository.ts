// src/modules/query-engine/query-engine.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TenantFactory } from '../../prisma/tenant.factory';
import { WebhookService } from 'src/modules/webhook/webhook.service';
import { CacheService } from '../cache.service';
import { AuditService } from 'src/modules/audit/audit.service';
import { QueryDto } from '../dto/query.dto';
import { CreateQueryEngineDto } from '../dto/create-query-engine.dto';
import { UpdateQueryEngineDto } from '../dto/update-query-engine.dto';

@Injectable()
export class QueryEngineRepository {
  private readonly logger = new Logger(QueryEngineRepository.name);

  constructor(
    private tenantFactory: TenantFactory,
    private cache: CacheService,
    private webhooks: WebhookService,
    private audit: AuditService,
  ) {}

  async findMany(
    tenantId: string,
    databaseId: string,
    model: string,
    query: QueryDto,
    apiKeyId?: string,
  ) {
    const client = await this.tenantFactory.getClient(tenantId, databaseId);
    this.validateModel(client, model);

    const cacheKey = this.cache.buildKey(tenantId, model, 'many', query);
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const prismaQuery = this.buildFindManyQuery(query);
    const data = await (client as any)[this.toCamel(model)].findMany(
      prismaQuery,
    );

    await this.cache.set(cacheKey, data, 60);
    await this.audit.log(tenantId, apiKeyId, 'READ', model, null, null);
    return data;
  }

  async findOne(
    tenantId: string,
    databaseId: string,
    model: string,
    id: string,
    query: QueryDto,
    apiKeyId?: string,
  ) {
    const client = await this.tenantFactory.getClient(tenantId, databaseId);
    this.validateModel(client, model);

    const cacheKey = this.cache.buildKey(tenantId, model, `one:${id}`, query);
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const data = await (client as any)[this.toCamel(model)].findUnique({
      where: { id: this.parseId(id) },
      include: query.include ? this.parseInclude(query.include) : undefined,
      select: query.select ? this.parseSelect(query.select) : undefined,
    });

    if (!data) throw new NotFoundException(`${model} with id ${id} not found`);

    await this.cache.set(cacheKey, data, 300);
    return data;
  }

  async create(dto: CreateQueryEngineDto) {
    const { tenantId, databaseId, model, data, apiKeyId } = dto;
    const client = await this.tenantFactory.getClient(tenantId, databaseId);
    this.validateModel(client, model);

    const result = await (client as any)[this.toCamel(model)].create({ data });

    await this.cache.invalidateModel(tenantId, model);
    await this.audit.log(tenantId, apiKeyId, 'CREATE', model, result.id, {
      data,
    });
    await this.webhooks.dispatch(tenantId, 'record.created', model, result);

    return result;
  }

  async update(dto: UpdateQueryEngineDto, id: string) {
    const { tenantId, databaseId, model, data, apiKeyId } = dto;
    const client = await this.tenantFactory.getClient(tenantId, databaseId);
    this.validateModel(client, model);

    const before = await (client as any)[this.toCamel(model)].findUnique({
      where: { id: this.parseId(id) },
    });
    if (!before)
      throw new NotFoundException(`${model} with id ${id} not found`);

    const result = await (client as any)[this.toCamel(model)].update({
      where: { id: this.parseId(id) },
      data,
    });

    await this.cache.invalidateModel(tenantId, model);
    await this.cache.delete(
      this.cache.buildKey(tenantId, model, `one:${id}`, {}),
    );
    await this.audit.log(tenantId, apiKeyId, 'UPDATE', model, id, {
      before,
      after: result,
    });
    await this.webhooks.dispatch(tenantId, 'record.updated', model, {
      id,
      before,
      after: result,
    });

    return result;
  }

  async remove(
    tenantId: string,
    databaseId: string,
    model: string,
    id: string,
    apiKeyId?: string,
  ) {
    const client = await this.tenantFactory.getClient(tenantId, databaseId);
    this.validateModel(client, model);

    const existing = await (client as any)[this.toCamel(model)].findUnique({
      where: { id: this.parseId(id) },
    });
    if (!existing)
      throw new NotFoundException(`${model} with id ${id} not found`);

    const result = await (client as any)[this.toCamel(model)].delete({
      where: { id: this.parseId(id) },
    });

    await this.cache.invalidateModel(tenantId, model);
    await this.audit.log(tenantId, apiKeyId, 'DELETE', model, id, null);
    await this.webhooks.dispatch(tenantId, 'record.deleted', model, {
      id,
      data: existing,
    });

    return result;
  }

  async count(
    tenantId: string,
    databaseId: string,
    model: string,
    query: QueryDto,
  ) {
    const client = await this.tenantFactory.getClient(tenantId, databaseId);
    this.validateModel(client, model);

    const cacheKey = this.cache.buildKey(tenantId, model, 'count', query);
    const cached = await this.cache.get(cacheKey);
    if (cached !== null) return cached;

    const count = await (client as any)[this.toCamel(model)].count({
      where: query.filter ? this.parseFilter(query.filter) : undefined,
    });

    await this.cache.set(cacheKey, count, 30);
    return { count };
  }

  async bulkCreate(
    dto: CreateQueryEngineDto,
    items: any[],
  ) {
    const { tenantId, databaseId, model, apiKeyId } = dto;
    const client = await this.tenantFactory.getClient(tenantId, databaseId);
    this.validateModel(client, model);

    const result = await (client as any)[this.toCamel(model)].createMany({
      data: items,
      skipDuplicates: true,
    });

    await this.cache.invalidateModel(tenantId, model);
    await this.audit.log(tenantId, apiKeyId, 'BULK_CREATE', model, null, {
      count: result.count,
    });
    return result;
  }

  // ─── Helpers ──────────────────────────────────────────────────────

  private validateModel(client: any, model: string) {
    if (!(this.toCamel(model) in client)) {
      throw new BadRequestException(
        `Model "${model}" not found in this database schema`,
      );
    }
  }

  private toCamel(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  private parseId(id: string): any {
    const num = Number(id);
    return isNaN(num) ? id : num;
  }

  private buildFindManyQuery(query: QueryDto) {
    return {
      where: query.filter ? this.parseFilter(query.filter) : undefined,
      orderBy: query.orderBy ? this.parseOrderBy(query.orderBy) : undefined,
      include: query.include ? this.parseInclude(query.include) : undefined,
      select: query.select ? this.parseSelect(query.select) : undefined,
      take: query.limit ? parseInt(String(query.limit)) : 20,
      skip: query.page
        ? (parseInt(String(query.page)) - 1) * (query.limit ?? 20)
        : 0,
    };
  }

  private parseFilter(filter: Record<string, any>): any {
    // Supports: { field: value }, { field: { gte, lte, contains, in, ... } }
    return filter;
  }

  private parseOrderBy(orderBy: Record<string, 'asc' | 'desc'>): any {
    return Object.entries(orderBy).map(([k, v]) => ({ [k]: v }));
  }

  private parseInclude(include: string | Record<string, any>): any {
    if (typeof include === 'string') {
      return include
        .split(',')
        .reduce((acc, k) => ({ ...acc, [k.trim()]: true }), {});
    }
    return include;
  }

  private parseSelect(select: string | Record<string, any>): any {
    if (typeof select === 'string') {
      return select
        .split(',')
        .reduce((acc, k) => ({ ...acc, [k.trim()]: true }), {});
    }
    return select;
  }
}
