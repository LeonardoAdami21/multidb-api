import { Injectable } from '@nestjs/common';
import { QueryEngineRepository } from './repository/query-engine.repository';
import { WebhookService } from '../webhook/webhook.service';
import { QueryDto } from './dto/create-query-engine.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class QueryEngineService {
  constructor(
    private readonly queryEngineRepository: QueryEngineRepository,
    private readonly webhooks: WebhookService,
    private readonly audit: AuditService,
  ) {}

  async findAll(
    tenantId: string,
    databaseId: string,
    model: string,
    query: QueryDto,
    apiKeyId?: string,
  ) {
    const result = await this.queryEngineRepository.findMany(
      tenantId,
      databaseId,
      model,
      query,
      apiKeyId,
    );
    return result;
  }

  async findOne(
    tenantId: string,
    databaseId: string,
    model: string,
    id: string,
    query: QueryDto,
    apiKeyId?: string,
  ) {
    const result = await this.queryEngineRepository.findOne(
      tenantId,
      databaseId,
      model,
      id,
      query,
      apiKeyId,
    );
    return result;
  }

  async create(
    tenantId: string,
    databaseId: string,
    model: string,
    data: any,
    apiKeyId?: string,
  ) {
    const result = await this.queryEngineRepository.create(
      tenantId,
      databaseId,
      model,
      data,
      apiKeyId,
    );
    return result;
  }

  async update(
    tenantId: string,
    databaseId: string,
    model: string,
    id: string,
    data: any,
    apiKeyId?: string,
  ) {
    const result = await this.queryEngineRepository.update(
      tenantId,
      databaseId,
      model,
      id,
      data,
      apiKeyId,
    );
    return result;
  }

  async delete(
    tenantId: string,
    databaseId: string,
    model: string,
    id: string,
    apiKeyId?: string,
  ) {
    const result = await this.queryEngineRepository.remove(
      tenantId,
      databaseId,
      model,
      id,
      apiKeyId,
    );
    return result;
  }

  async count(
    tenantId: string,
    databaseId: string,
    model: string,
    query: QueryDto,
  ) {
    const result = await this.queryEngineRepository.count(
      tenantId,
      databaseId,
      model,
      query,
    );
    return result;
  }

  async bulkCreate(
    tenantId: string,
    databaseId: string,
    model: string,
    items: any[],
    apiKeyId?: string,
  ) {
    const result = await this.queryEngineRepository.bulkCreate(
      tenantId,
      databaseId,
      model,
      items,
      apiKeyId,
    );
    return result;
  }
}
