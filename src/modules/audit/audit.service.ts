import { Injectable } from '@nestjs/common';
import { CreateAuditDto } from './dto/create-audit.dto';
import { UpdateAuditDto } from './dto/update-audit.dto';
import { AuditRepository } from './repository/audit.repository';

@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  async log(
    tenantId: string,
    apiKeyId: string | undefined | null,
    action: string,
    resource: string,
    resourceId: string | null | undefined,
    metadata: any,
    context?: { ip?: string; userAgent?: string },
  ) {
    const result = await this.auditRepository.log(
      tenantId,
      apiKeyId,
      action,
      resource,
      resourceId,
      metadata,
      context,
    );
    return result;
  }

  async findAll(
    tenantId: string,
    filters: {
      resource?: string;
      action?: string;
      from?: Date;
      to?: Date;
      page?: number;
      limit?: number;
    },
  ) {
    const result = await this.auditRepository.findAll(tenantId, filters);
    return result;
  }
}
