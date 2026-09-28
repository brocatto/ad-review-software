import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const isProduction = process.env.NODE_ENV === 'production';

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@adverse.com';
  const password = process.env.ADMIN_PASSWORD || (isProduction ? undefined : 'admin123');

  if (!password || password.length < 8) {
    throw new Error('Defina ADMIN_PASSWORD (mínimo 8 caracteres) para criar o admin em produção');
  }

  // Create admin user (never overwrites an existing user's password)
  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: await bcrypt.hash(password, 10),
      fullName: 'Admin User',
      role: 'ADMIN',
    },
  });

  console.log('Admin user:', admin.email);

  if (isProduction) return;

  // Sample client for local development
  const client = await prisma.client.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000001',
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
