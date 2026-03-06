// src/modules/auth/strategies/api-key.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { ApiKeyService } from '../api-key.service';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private apiKeys: ApiKeyService) {
    super();
  }

  async validate(req: Request) {
    const rawKey = req.headers['x-api-key'] as string;
    if (!rawKey) return null;
    return this.apiKeys.validate(rawKey);
  }
}
