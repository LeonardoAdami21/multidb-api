// src/modules/auth/api-key.service.ts
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { PrismaService } from '../prisma/prisma.service';

export const API_KEY_SCOPES = [
  'db:read',
  'db:write',
  'db:delete',
  'schema:manage',
  'admin:full',
] as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

@Injectable()
export class ApiKeyService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateApiKeyDto) {
    const rawKey = `sk_live_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 16) + '...';

    const apiKey = await this.prisma.apiKey.create({
      data: {
        tenantId,
        name: dto.name,
        keyHash,
        keyPrefix,
        scopes: dto.scopes,
        expiresAt: dto.expiresAt,
      },
    });

    // Return raw key only once at creation time
    return { ...apiKey, key: rawKey };
  }

  async validate(
    rawKey: string,
  ): Promise<{ tenantId: string; scopes: string[]; keyId: string }> {
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const apiKey = await this.prisma.apiKey.findUnique({ where: { keyHash } });

    if (!apiKey || !apiKey.isActive) {
      throw new UnauthorizedException('Invalid API key');
    }
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      throw new UnauthorizedException('API key expired');
    }

    // Update last used timestamp async
    this.prisma.apiKey
      .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});

    return {
      tenantId: apiKey.tenantId,
      scopes: apiKey.scopes,
      keyId: apiKey.id,
    };
  }

  async findAll(tenantId: string) {
    return this.prisma.apiKey.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  async revoke(tenantId: string, keyId: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, tenantId },
    });
    if (!key) throw new NotFoundException('API key not found');
    return this.prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });
  }

  hasScope(scopes: string[], required: ApiKeyScope): boolean {
    return scopes.includes('admin:full') || scopes.includes(required);
  }
}
