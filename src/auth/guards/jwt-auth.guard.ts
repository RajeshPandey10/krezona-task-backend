import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { JwtUtil } from '../../common/utils/jwt.util';
import { PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { AppError } from '../../common/utils/error.util';

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email: string;
    role: string;
  };
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtUtil: JwtUtil,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      AppError.unauthorized('Missing authorization token');
    }

    const token = authHeader.slice(7);
    const payload = this.jwtUtil.verifyToken(token) as {
      sub: string;
      email: string;
      role: string;
    };

    request.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    return true;
  }
}
