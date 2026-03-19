import { Injectable } from '@nestjs/common';
import { QueryEngineRepository } from './repository/query-engine.repository';
import { WebhookService } from '../webhook/webhook.service';
import { AuditService } from '../audit/audit.service';
import { QueryDto } from './dto/query.dto';
import { CreateQueryEngineDto } from './dto/create-query-engine.dto';
import { UpdateQueryEngineDto } from './dto/update-query-engine.dto';

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

  async create(dto: CreateQueryEngineDto,  req: any) {
    const result = await this.queryEngineRepository.create(dto);
    return result;
  }

  async update(req: any, dto: UpdateQueryEngineDto, id: string) {
    const result = await this.queryEngineRepository.update(dto, id);
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

  async bulkCreate(req: any, dto: CreateQueryEngineDto, items: any[]) {
    const result = await this.queryEngineRepository.bulkCreate(dto, items);
    return result;
  }
}
