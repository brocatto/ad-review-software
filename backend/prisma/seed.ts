import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@adverse.com' },
    update: { emailVerified: true },
    create: {
      email: 'admin@adverse.com',
      passwordHash,
      fullName: 'Admin User',
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  console.log('Created admin user:', admin.email);

  // Create sample client (associated with admin user)
  const client = await prisma.client.upsert({
    where: { id: 'sample-client-id' },
    update: {},
    create: {
      id: 'sample-client-id',
      name: 'Sample Client',
      email: 'client@example.com',
      company: 'Sample Company',
      contactPerson: 'John Doe',
      userId: admin.id,
    },
  });

  console.log('Created sample client:', client.name);

  // Create Pro plan for Stripe
  const plan = await prisma.plan.upsert({
    where: { name: 'pro' },
    update: {},
    create: {
      name: 'pro',
      displayName: 'Pro',
      priceMonthly: 9900,
      stripePriceId: process.env.STRIPE_PRICE_ID_MONTHLY || 'price_xxx',
      features: JSON.stringify(['Lotes ilimitados', 'Criativos ilimitados', 'Clientes ilimitados']),
      isActive: true,
    },
  });

  console.log('Created plan:', plan.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
