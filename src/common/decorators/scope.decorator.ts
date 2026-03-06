// src/common/decorators/scope.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const SCOPE_KEY = 'required_scope';
export const RequireScope = (scope: string) => SetMetadata(SCOPE_KEY, scope);

// src/common/decorators/tenant.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req.user?.tenantId;
  },
);
