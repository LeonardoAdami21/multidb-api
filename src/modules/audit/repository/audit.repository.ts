// src/modules/audit/audit.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditRepository {
  constructor(private prisma: PrismaService) {}

  async log(
    tenantId: string,
    apiKeyId: string | undefined | null,
    action: string,
    resource: string,
    resourceId: string | null | undefined,
    metadata: any,
    context?: { ip?: string; userAgent?: string },
  ) {
    return this.prisma.auditLog
      .create({
        data: {
          tenantId,
          apiKeyId,
          action,
          resource,
          resourceId: resourceId ? String(resourceId) : null,
          metadata,
          ipAddress: context?.ip,
          userAgent: context?.userAgent,
        },
      })
      .catch(() => {}); // Never fail a request due to audit logging
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
    const { resource, action, from, to, page = 1, limit = 50 } = filters;

    return this.prisma.auditLog.findMany({
      where: {
        tenantId,
        ...(resource && { resource }),
        ...(action && { action }),
        ...(from || to
          ? {
              createdAt: { ...(from && { gte: from }), ...(to && { lte: to }) },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    });
  }
}
