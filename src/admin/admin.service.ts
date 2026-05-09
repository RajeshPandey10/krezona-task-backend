import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AppError } from '../common/utils/error.util';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { CreateRoleDto } from '../roles/dto/create-role.dto';
import { UpdateSubscriptionDto } from '../subscriptions/dto/update-subscription.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UsersService } from '../users/users.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly subscriptionsService: SubscriptionsService,
  ) { }

  async dashboard() {
    const [users, projects, subscriptions, logs, failedLogs] =
      await Promise.all([
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
    return this.usersService.findAll();
  }

  async findUserById(id: string) {
    return this.usersService.findOne(id);
  }

  async createUser(dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  async updateUserRole(id: string, dto: UpdateUserRoleDto) {
    await this.findUserById(id);

    if (!dto.roleId && !dto.roleName) {
      AppError.badRequest('Either roleId or roleName is required');
    }

    const role = dto.roleId
      ? await this.prisma.role.findUnique({ where: { id: dto.roleId } })
      : await this.prisma.role.findUnique({
        where: { name: dto.roleName!.toUpperCase() },
      });

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
    try {
      await this.findUserById(id);

      await this.prisma.subscription.deleteMany({
        where: { userId: id },
      });

      await this.prisma.project.deleteMany({
        where: { creatorId: id },
      });

      await this.prisma.user.delete({ where: { id } });

      return {
        success: true,
        message: 'User deleted successfully',
      };
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      if (err.code === 'P2003' || err.code === 'P2025') {
        AppError.badRequest(
          'Cannot delete user. Ensure all related data has been removed.',
        );
      }
      throw error;
    }
  }

  findRoles() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createRole(dto: CreateRoleDto) {
    const normalizedName = dto.name.toUpperCase();
    const existing = await this.prisma.role.findUnique({
      where: { name: normalizedName },
    });
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
      const duplicate = await this.prisma.role.findUnique({
        where: { name: normalizedName },
      });
      if (duplicate && duplicate.id !== id) {
        AppError.badRequest('Role name already exists');
      }
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.toUpperCase() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
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
    return this.subscriptionsService.findAll();
  }

  findSubscriptionByUserId(userId: string) {
    return this.subscriptionsService.findByUserId(userId);
  }

  async updateSubscriptionForUser(userId: string, dto: UpdateSubscriptionDto) {
    return this.subscriptionsService.updateForUser(userId, dto);
  }

  async activateSubscription(userId: string) {
    return this.subscriptionsService.updateForUser(userId, {
      status: 'ACTIVE',
    });
  }

  async deactivateSubscription(userId: string) {
    return this.subscriptionsService.updateForUser(userId, {
      status: 'CANCELLED',
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
