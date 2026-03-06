import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeyService } from 'src/modules/auth/api-key.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private apiKeys: ApiKeyService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const key = req.headers['x-api-key'] as string;
    if (!key) throw new UnauthorizedException('API key required');
    const result = await this.apiKeys.validate(key);
    req.user = result; // { tenantId, scopes, keyId }
    return true;
  }
}
