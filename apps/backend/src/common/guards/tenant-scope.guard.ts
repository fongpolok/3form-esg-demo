import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TenantScopeService } from '../../modules/org/tenant-scope.service';
import type { AuthenticatedUser } from '../types/authenticated-user';

// Runs after AuthGuard('jwt') on every request and attaches req.scope —
// every module's query layer (WorkOrdersModule, EsgMetricsModule, etc.) is
// responsible for applying req.scope as a WHERE filter; this guard only
// resolves *what* the filter should be, it never blocks a request itself
// (that's RolesGuard's job for role-gated endpoints). Public routes (login,
// health) are excluded via IS_PUBLIC_KEY on the AuthGuard, so this guard
// only ever runs where req.user is already populated.
@Injectable()
export class TenantScopeGuard implements CanActivate {
  constructor(private readonly tenantScopeService: TenantScopeService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;
    if (!user) return true; // no authenticated user yet (e.g. public route) — nothing to scope

    request.scope = await this.tenantScopeService.resolve(user);
    return true;
  }
}
