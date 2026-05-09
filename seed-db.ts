import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

interface RoleData {
    name: string;
    description: string;
}

async function main(): Promise<void> {
    console.log('Seeding database...');

    // Seed roles
    const roles: RoleData[] = [
        { name: 'ADMIN', description: 'Administrator with full access' },
        { name: 'ENGINEER', description: 'Project engineer' },
        { name: 'VIEWER', description: 'Read-only viewer' },
    ];

    for (const role of roles) {
        const existingRole = await prisma.role.findUnique({
            where: { name: role.name },
        });

        if (!existingRole) {
            await prisma.role.create({ data: role });
            console.log(`Created role: ${role.name}`);
        } else {
            console.log(`Role already exists: ${role.name}`);
        }
    }

    // Seed admin user
    const adminRole = await prisma.role.findUnique({
        where: { name: 'ADMIN' },
    });

    if (adminRole) {
        const existingAdmin = await prisma.user.findUnique({
            where: { email: 'admin@gmail.com' },
        });

        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const adminUser = await prisma.user.create({
                data: {
                    email: 'admin@gmail.com',
                    password: hashedPassword,
                    firstName: 'Admin',
                    lastName: 'User',
                    roleId: adminRole.id,
                    isActive: true,
                    isVerified: true,
                },
            });
            console.log(`Created admin user: ${adminUser.email}`);

            // Create subscription for admin user
            await prisma.subscription.create({
                data: {
                    userId: adminUser.id,
                    plan: 'PROFESSIONAL',
                    status: 'ACTIVE',
                    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
                },
            });
            console.log('Created admin subscription (PROFESSIONAL, 1 year)');
        } else {
            console.log('Admin user already exists: admin@gmail.com');
        }
    }

    console.log('Seeding completed!');
}

main()
    .catch((e) => {
        console.error('Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
