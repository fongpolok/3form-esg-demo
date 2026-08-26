import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';

interface JwtPayload {
  sub: string;
  email: string;
  displayName: string;
  localePref: 'en' | 'zh_HK';
  memberships: AuthenticatedUser['memberships'];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not set — see .env.example');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  // Whatever this returns becomes req.user. We embed memberships directly in
  // the access token at login time (see AuthService.issueTokens) so every
  // request avoids an extra membership lookup — refresh tokens are what
  // force a re-read of current memberships, on a short access-token TTL.
  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      id: payload.sub,
      email: payload.email,
      displayName: payload.displayName,
      localePref: payload.localePref,
      memberships: payload.memberships,
    };
  }
}
