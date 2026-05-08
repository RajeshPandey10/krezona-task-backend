import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

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
}
