import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AppError } from '../common/utils/error.util';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

type RequestUser = {
  id: string;
  role: 'ADMIN' | 'ENGINEER' | 'VIEWER' | string;
};

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

  findAll(
    _user: RequestUser,
    filters: { creatorId?: string; role?: string } = {},
  ) {
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

  async findOne(id: string, _user: RequestUser) {
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

  async update(id: string, dto: UpdateProjectDto, user: RequestUser) {
    const project = await this.findOne(id, user);

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

  async remove(id: string, user: RequestUser) {
    const project = await this.findOne(id, user);

    if (user.role !== 'ADMIN' && project.creatorId !== user.id) {
      AppError.forbidden('You can only delete your own projects');
    }

    await this.prisma.project.delete({ where: { id } });
    return { success: true, message: 'Project deleted successfully' };
  }
}
