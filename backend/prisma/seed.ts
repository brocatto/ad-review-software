import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@adverse.com' },
    update: {},
    create: {
      email: 'admin@adverse.com',
      passwordHash,
      fullName: 'Admin User',
      role: 'ADMIN',
    },
  });

  console.log('Created admin user:', admin.email);

  // Create sample client
  const client = await prisma.client.upsert({
    where: { id: 'sample-client-id' },
    update: {},
    create: {
      id: 'sample-client-id',
      name: 'Sample Client',
      email: 'client@example.com',
      company: 'Sample Company',
      contactPerson: 'John Doe',
    },
  });

  console.log('Created sample client:', client.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
