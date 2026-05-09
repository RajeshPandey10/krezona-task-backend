import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AppError } from '../common/utils/error.util';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import type { CurrentUserShape } from '../common/decorators/current-user.decorator';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

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
    const where = {
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
    };

    return this.prisma.project.findMany({
      where,
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

  async update(id: string, dto: UpdateProjectDto, user: CurrentUserShape) {
    const project = await this.findOne(id);

    if (user.role !== 'ADMIN' && project.creatorId !== user.id) {
      AppError.forbidden('You can only update your own projects');
    }

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

  async remove(id: string, user: CurrentUserShape) {
    const project = await this.findOne(id);

    if (user.role !== 'ADMIN' && project.creatorId !== user.id) {
      AppError.forbidden('You can only delete your own projects');
    }

    await this.prisma.project.delete({ where: { id } });
    return { success: true, message: 'Project deleted successfully' };
  }
}
