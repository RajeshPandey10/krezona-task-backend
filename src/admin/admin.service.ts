import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import { AppError } from '../common/utils/error.util';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { CreateRoleDto } from '../roles/dto/create-role.dto';
import { UpdateSubscriptionDto } from '../subscriptions/dto/update-subscription.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class AdminService {
    constructor(private readonly prisma: PrismaService) { }

    async dashboard() {
        const [users, projects, subscriptions, logs, failedLogs] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.project.count(),
            this.prisma.subscription.count(),
            this.prisma.loginLog.count(),
            this.prisma.loginLog.count({ where: { success: false } }),
        ]);

        return {
            users,
            projects,
            subscriptions,
            logs,
            failedLogs,
        };
    }

    findUsers() {
        return this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                isActive: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
                role: true,
                subscription: true,
            },
        });
    }

    async findUserById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                isActive: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
                role: true,
                subscription: true,
            },
        });

        if (!user) {
            AppError.notFound('User not found');
        }

        return user;
    }

    async createUser(dto: CreateUserDto) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) {
            AppError.badRequest('Email already registered');
        }

        let roleId = dto.roleId;
        if (!roleId) {
            const viewerRole = await this.prisma.role.findUnique({ where: { name: 'VIEWER' } });
            roleId = viewerRole?.id;
        }

        if (!roleId) {
            AppError.badRequest('Role not found');
        }

        const password = await bcrypt.hash(dto.password, 10);

        return this.prisma.user.create({
            data: {
                email: dto.email,
                password,
                firstName: dto.firstName,
                lastName: dto.lastName,
                roleId,
                isActive: dto.isActive ?? true,
                isVerified: dto.isVerified ?? true,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                isActive: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
                role: true,
                subscription: true,
            },
        });
    }

    async updateUser(id: string, dto: UpdateUserDto) {
        await this.findUserById(id);

        if (dto.roleId) {
            const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
            if (!role) {
                AppError.badRequest('Role not found');
            }
        }

        const data = {
            ...dto,
            ...(dto.password ? { password: await bcrypt.hash(dto.password, 10) } : {}),
        };

        return this.prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                isActive: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
                role: true,
                subscription: true,
            },
        });
    }

    async updateUserRole(id: string, dto: UpdateUserRoleDto) {
        await this.findUserById(id);

        if (!dto.roleId && !dto.roleName) {
            AppError.badRequest('Either roleId or roleName is required');
        }

        const role = dto.roleId
            ? await this.prisma.role.findUnique({ where: { id: dto.roleId } })
            : await this.prisma.role.findUnique({ where: { name: dto.roleName!.toUpperCase() } });

        if (!role) {
            AppError.badRequest('Role not found');
        }

        return this.prisma.user.update({
            where: { id },
            data: { roleId: role.id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                isActive: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
                role: true,
                subscription: true,
            },
        });
    }

    async removeUser(id: string) {
        await this.findUserById(id);

        await this.prisma.user.delete({ where: { id } });

        return {
            success: true,
            message: 'User deleted successfully',
        };
    }

    findRoles() {
        return this.prisma.role.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async createRole(dto: CreateRoleDto) {
        const normalizedName = dto.name.toUpperCase();
        const existing = await this.prisma.role.findUnique({ where: { name: normalizedName } });
        if (existing) {
            AppError.badRequest('Role already exists');
        }

        return this.prisma.role.create({
            data: {
                name: normalizedName,
                description: dto.description,
            },
        });
    }

    async updateRole(id: string, dto: UpdateRoleDto) {
        const existing = await this.prisma.role.findUnique({ where: { id } });
        if (!existing) {
            AppError.notFound('Role not found');
        }

        if (dto.name) {
            const normalizedName = dto.name.toUpperCase();
            const duplicate = await this.prisma.role.findUnique({ where: { name: normalizedName } });
            if (duplicate && duplicate.id !== id) {
                AppError.badRequest('Role name already exists');
            }
        }

        return this.prisma.role.update({
            where: { id },
            data: {
                ...(dto.name ? { name: dto.name.toUpperCase() } : {}),
                ...(dto.description !== undefined ? { description: dto.description } : {}),
            },
        });
    }

    async removeRole(id: string) {
        const role = await this.prisma.role.findUnique({ where: { id } });
        if (!role) {
            AppError.notFound('Role not found');
        }

        if (['ADMIN', 'ENGINEER', 'VIEWER'].includes(role.name)) {
            AppError.badRequest('Default roles cannot be deleted');
        }

        const usersCount = await this.prisma.user.count({ where: { roleId: id } });
        if (usersCount > 0) {
            AppError.badRequest('Cannot delete role assigned to users');
        }

        await this.prisma.role.delete({ where: { id } });

        return {
            success: true,
            message: 'Role deleted successfully',
        };
    }

    findSubscriptions() {
        return this.prisma.subscription.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    findSubscriptionByUserId(userId: string) {
        return this.prisma.subscription.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }

    async updateSubscriptionForUser(userId: string, dto: UpdateSubscriptionDto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
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
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }

    async activateSubscription(userId: string) {
        const existing = await this.prisma.subscription.findUnique({ where: { userId } });
        if (!existing) {
            AppError.notFound('Subscription not found');
        }

        return this.prisma.subscription.update({
            where: { userId },
            data: { status: 'ACTIVE' },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }

    async deactivateSubscription(userId: string) {
        const existing = await this.prisma.subscription.findUnique({ where: { userId } });
        if (!existing) {
            AppError.notFound('Subscription not found');
        }

        return this.prisma.subscription.update({
            where: { userId },
            data: { status: 'CANCELLED' },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }

    findLogs(userId?: string) {
        return this.prisma.loginLog.findMany({
            where: userId ? { userId } : undefined,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
