import { SetMetadata } from '@nestjs/common';

export const SUBSCRIPTION_KEY = 'subscription_plans';
export const RequireSubscription = (...plans: string[]) => SetMetadata(SUBSCRIPTION_KEY, plans);