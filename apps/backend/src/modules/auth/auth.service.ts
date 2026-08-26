import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'node:crypto';
import type { Membership } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import type { LoginInput } from '@esg/shared-validation';
import type { LoginResponseDto } from '@esg/shared-types';

const REFRESH_TOKEN_BYTES = 48;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(input: LoginInput): Promise<LoginResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      include: { memberships: true },
    });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException({ code: 'AUTH.INVALID_CREDENTIALS' });
    }

    const passwordOk = await argon2.verify(user.password_hash, input.password);
    if (!passwordOk) {
      throw new UnauthorizedException({ code: 'AUTH.INVALID_CREDENTIALS' });
    }

    const authUser: AuthenticatedUser = {
      id: user.id.toString(),
      email: user.email,
      displayName: user.display_name,
      localePref: user.locale_pref === 'zh_HK' ? 'zh_HK' : 'en',
      memberships: user.memberships.map((m: Membership) => ({
        role: m.role,
        scopeType: m.scope_type,
        scopeId: m.scope_id?.toString() ?? null,
      })),
    };

    return this.issueTokens(authUser);
  }

  async refresh(refreshToken: string): Promise<LoginResponseDto> {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { token_hash: tokenHash, revoked_at: null },
      include: { user: { include: { memberships: true } } },
    });
    if (!stored || stored.expires_at < new Date()) {
      throw new UnauthorizedException({ code: 'AUTH.INVALID_REFRESH_TOKEN' });
    }

    // Rotate: revoke the used refresh token, issue a fresh pair. Prevents a
    // leaked refresh token from being replayed indefinitely.
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked_at: new Date() },
    });

    const user = stored.user;
    const authUser: AuthenticatedUser = {
      id: user.id.toString(),
      email: user.email,
      displayName: user.display_name,
      localePref: user.locale_pref === 'zh_HK' ? 'zh_HK' : 'en',
      memberships: user.memberships.map((m: Membership) => ({
        role: m.role,
        scopeType: m.scope_type,
        scopeId: m.scope_id?.toString() ?? null,
      })),
    };
    return this.issueTokens(authUser);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { token_hash: tokenHash, revoked_at: null },
      data: { revoked_at: new Date() },
    });
  }

  private async issueTokens(user: AuthenticatedUser): Promise<LoginResponseDto> {
    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        displayName: user.displayName,
        localePref: user.localePref,
        memberships: user.memberships,
      },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: process.env.JWT_ACCESS_TTL ?? '15m' },
    );

    const refreshToken = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    const refreshTtlMs = this.parseTtlToMs(process.env.JWT_REFRESH_TTL ?? '30d');
    await this.prisma.refreshToken.create({
      data: {
        user_id: BigInt(user.id),
        token_hash: this.hashToken(refreshToken),
        expires_at: new Date(Date.now() + refreshTtlMs),
      },
    });

    return { accessToken, refreshToken, user };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseTtlToMs(ttl: string): number {
    const match = /^(\d+)([smhd])$/.exec(ttl);
    if (!match) return 30 * 24 * 60 * 60 * 1000; // fallback: 30 days
    const value = Number(match[1]);
    const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2] as 's' | 'm' | 'h' | 'd'];
    return value * unitMs;
  }
}
