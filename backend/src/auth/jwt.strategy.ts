import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { UsersService } from '../users/users.service';

const fromRequest = (req: Request): string | null => {
  const header =
    req.headers.authorization || req.headers['x-access-token'] || req.headers['x-taskflow-token'];
  if (typeof header === 'string') {
    return header.startsWith('Bearer ') ? header.slice(7).trim() : header.trim();
  }
  const query = req.query?.access_token;
  if (typeof query === 'string' && query) return query;
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([fromRequest]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') || 'dev-secret',
    });
  }

  async validate(payload: { sub: string }) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) throw new UnauthorizedException('Not authorized, user not found');
    return { userId: user._id.toString(), email: user.email, name: user.name };
  }
}
