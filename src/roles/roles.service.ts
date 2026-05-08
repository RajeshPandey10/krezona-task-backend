import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AppError } from '../common/utils/error.util';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RolesService {
    constructor(private readonly prisma: PrismaService) { }

    findAll() {
        return this.prisma.role.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async create(dto: CreateRoleDto) {
        const existing = await this.prisma.role.findUnique({ where: { name: dto.name } });
        if (existing) {
            AppError.badRequest('Role already exists');
        }

        return this.prisma.role.create({ data: dto });
    }
}
