import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AppError } from '../common/utils/error.util';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
    constructor(private readonly prisma: PrismaService) { }

    create(dto: CreateProjectDto, creatorId: string) {
        return this.prisma.project.create({
            data: {
                ...dto,
                creatorId,
            },
            include: {
                creator: {
                    include: { role: true },
                },
            },
        });
    }

    findAll(filters: { creatorId?: string; role?: string } = {}) {
        return this.prisma.project.findMany({
            where: {
                ...(filters.creatorId ? { creatorId: filters.creatorId } : {}),
                ...(filters.role
                    ? {
                        creator: {
                            role: {
                                name: filters.role,
                            },
                        },
                    }
                    : {}),
            },
            include: {
                creator: {
                    include: { role: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const project = await this.prisma.project.findUnique({
            where: { id },
            include: {
                creator: {
                    include: { role: true },
                },
            },
        });

        if (!project) {
            AppError.notFound('Project not found');
        }

        return project;
    }

    async update(id: string, dto: UpdateProjectDto) {
        await this.findOne(id);
        return this.prisma.project.update({
            where: { id },
            data: dto,
            include: {
                creator: {
                    include: { role: true },
                },
            },
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        await this.prisma.project.delete({ where: { id } });
        return { success: true, message: 'Project deleted successfully' };
    }
}
