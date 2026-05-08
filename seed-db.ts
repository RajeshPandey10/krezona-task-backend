import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  const roles = [
    { name: 'ADMIN', description: 'Administrator with full access' },
    { name: 'ENGINEER', description: 'Project engineer' },
    { name: 'MANAGER', description: 'Project manager' },
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