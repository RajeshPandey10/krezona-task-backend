import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId?: string) {
    return this.prisma.loginLog.findMany({
      where: userId ? { userId } : undefined,
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByUserId(userId: string) {
    return this.findAll(userId);
  }
}
