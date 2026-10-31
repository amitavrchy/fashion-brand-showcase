import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';

export type SessionUser = { id: string; email: string; name: string; role: 'CUSTOMER' | 'ADMIN' };
export type AuthRequest = Request & { user: SessionUser };
export const publicUser = { id: true, email: true, name: true, role: true } as const;

@Injectable()
export class SessionService {
  constructor(@Inject(JwtService) private jwt: JwtService, @Inject(PrismaService) private db: PrismaService) {}
  async user(request: Request): Promise<SessionUser | null> {
    const raw = request.headers.cookie?.split(';').find(v => v.trim().startsWith('lune_session='))?.trim().slice('lune_session='.length);
    if (!raw) return null;
    try {
      const { sub } = await this.jwt.verifyAsync<{ sub: string }>(decodeURIComponent(raw));
      return await this.db.user.findUnique({ where: { id: sub }, select: publicUser });
    } catch { return null; }
  }
}
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(@Inject(SessionService) private session: SessionService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const user = await this.session.user(request);
    if (!user) throw new UnauthorizedException('Please sign in to continue.');
    request.user = user;
    return true;
  }
}
@Injectable()
export class AdminGuard extends SessionGuard {
  override async canActivate(context: ExecutionContext) {
    await super.canActivate(context);
    if (context.switchToHttp().getRequest<AuthRequest>().user.role !== 'ADMIN') throw new ForbiddenException('Administrator access required.');
    return true;
  }
}
