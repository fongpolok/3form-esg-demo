import type { MembershipRole, ScopeType } from '@prisma/client';

export interface MembershipClaim {
  role: MembershipRole;
  scopeType: ScopeType;
  scopeId: string | null; // BigInt serialized as string in the JWT payload
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  localePref: 'en' | 'zh_HK';
  memberships: MembershipClaim[];
}

// Resolved once per request by TenantScopeGuard: the concrete set of
// facility/client/supplier ids this user is allowed to touch. isGlobal=true
// (AUDITOR) means "skip filtering" rather than "empty set".
export interface TenantScope {
  isGlobal: boolean;
  supplierIds: string[];
  facilityIds: string[];
  clientIds: string[];
}
