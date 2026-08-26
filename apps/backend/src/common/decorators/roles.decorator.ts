import { SetMetadata } from '@nestjs/common';
import type { MembershipRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

// Usage: @Roles('AUDITOR', 'SUPPLIER_ADMIN') above a controller method.
// An endpoint with no @Roles() is reachable by any authenticated role —
// use this deliberately, not as a default-open oversight.
export const Roles = (...roles: MembershipRole[]) => SetMetadata(ROLES_KEY, roles);
