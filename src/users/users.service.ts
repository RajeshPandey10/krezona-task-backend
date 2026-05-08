import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import { AppError } from '../common/utils/error.util';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateUserDto) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) {
            AppError.badRequest('Email already registered');
        }

        const roleId = dto.roleId ?? (await this.prisma.role.findUnique({ where: { name: 'VIEWER' } }))?.id;
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
            },
        });
    }

    async findAll() {
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

    async findOne(id: string) {
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

    async update(id: string, dto: UpdateUserDto) {
        await this.findOne(id);

        if (dto.roleId) {
            const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
            if (!role) {
                AppError.badRequest('Role not found');
            }
        }

        return this.prisma.user.update({
            where: { id },
            data: dto,
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

    async remove(id: string) {
        await this.findOne(id);
        await this.prisma.user.delete({ where: { id } });

        return {
            success: true,
            message: 'User deleted successfully',
        };
    }
}
