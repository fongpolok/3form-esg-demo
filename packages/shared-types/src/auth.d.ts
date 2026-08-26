export type MembershipRole = 'AUDITOR' | 'SUPPLIER_ADMIN' | 'SUPPLIER_STAFF' | 'CLIENT_USER';
export type ScopeType = 'GLOBAL' | 'SUPPLIER' | 'FACILITY' | 'CLIENT';
export interface MembershipDto {
    role: MembershipRole;
    scopeType: ScopeType;
    scopeId: string | null;
}
export interface CurrentUserDto {
    id: string;
    email: string;
    displayName: string;
    localePref: 'en' | 'zh_HK';
    memberships: MembershipDto[];
}
export interface LoginResponseDto {
    accessToken: string;
    refreshToken: string;
    user: CurrentUserDto;
}
