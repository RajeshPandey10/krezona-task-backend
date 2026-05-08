import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AppError } from '../common/utils/error.util';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class SubscriptionsService {
    constructor(private readonly prisma: PrismaService) { }

    findAll() {
        return this.prisma.subscription.findMany({
            include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    findByUserId(userId: string) {
        return this.prisma.subscription.findUnique({
            where: { userId },
            include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
        });
    }

    async updateForUser(userId: string, dto: UpdateSubscriptionDto) {
        const existingUser = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!existingUser) {
            AppError.notFound('User not found');
        }

        return this.prisma.subscription.upsert({
            where: { userId },
            create: {
                userId,
                plan: dto.plan ?? 'FREE_TRIAL',
                status: dto.status ?? 'ACTIVE',
                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
            },
            update: {
                ...(dto.plan ? { plan: dto.plan } : {}),
                ...(dto.status ? { status: dto.status } : {}),
                ...(dto.expiresAt !== undefined ? { expiresAt: new Date(dto.expiresAt) } : {}),
            },
            include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
        });
    }

    async remove(userId: string) {
        const existing = await this.prisma.subscription.findUnique({ where: { userId } });
        if (!existing) {
            AppError.notFound('Subscription not found');
        }

        await this.prisma.subscription.delete({ where: { userId } });
        return { success: true, message: 'Subscription removed successfully' };
    }
}
