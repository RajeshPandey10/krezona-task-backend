import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {

        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { PrismaPg } = require('@prisma/adapter-pg');
            const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
            super({ adapter, log: ['query', 'info', 'warn', 'error'] });
        } catch (e) {
            throw new Error(
                'Prisma client requires a driver adapter for the "client" engine.\n' +
                'Install it with: `npm install @prisma/adapter-pg` and set your DATABASE_URL in environment.\n' +
                'Original error: ' + (e instanceof Error ? e.message : String(e)),
            );
        }
    }
    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}