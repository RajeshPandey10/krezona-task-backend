import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';
import type { RequestWithUser } from '../decorators/current-user.decorator';
import { SUBSCRIPTION_KEY } from '../decorators/subscription.decorator';
import { AppError } from '../utils/error.util';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlans = this.reflector.getAllAndOverride<string[]>(
      SUBSCRIPTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPlans || requiredPlans.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = request.user?.id;

    if (!userId) {
      AppError.unauthorized('Authentication required');
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      AppError.forbidden('Subscription required');
    }

    if (subscription.status !== 'ACTIVE') {
      AppError.forbidden('Subscription is not active');
    }

    if (
      subscription.expiresAt &&
      new Date(subscription.expiresAt) < new Date()
    ) {
      AppError.forbidden('Subscription has expired');
    }

    if (!requiredPlans.includes(subscription.plan)) {
      AppError.forbidden('Your subscription plan does not allow this action');
    }

    return true;
  }
}
