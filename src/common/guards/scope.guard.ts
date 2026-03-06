import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SCOPE_KEY } from '../decorators/scope.decorator';

@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.get<string>(SCOPE_KEY, ctx.getHandler());
    if (!required) return true;
    const req = ctx.switchToHttp().getRequest();
    const scopes: string[] = req.user?.scopes ?? [];
    if (scopes.includes('admin:full') || scopes.includes(required)) return true;
    throw new ForbiddenException(`Scope required: ${required}`);
  }
}
