import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { TenantScope } from '../types/authenticated-user';

// Reads req.scope, populated by TenantScopeGuard. Only valid on routes that
// run after TenantScopeGuard (i.e. anything behind JwtAuthGuard) — using it
// on a @Public() route will yield undefined.
export const CurrentScope = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TenantScope => {
    const request = ctx.switchToHttp().getRequest();
    return request.scope as TenantScope;
  },
);
