/* eslint-disable @typescript-eslint/no-var-requires */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@adverse.com').trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!password || password.length < 8) {
    throw new Error(
      'Defina SEED_ADMIN_PASSWORD (mínimo 8 caracteres) para criar o usuário admin. ' +
        'Ex.: SEED_ADMIN_PASSWORD=uma-senha-forte npm run db:seed',
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Platform admin: verified, never billed (SubscriptionGuard skips ADMIN)
  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: 'ADMIN', emailVerified: true, subscriptionStatus: 'ACTIVE' },
    create: {
      email,
      passwordHash,
      fullName: 'Admin User',
      role: 'ADMIN',
      authProvider: 'LOCAL',
      emailVerified: true,
      subscriptionStatus: 'ACTIVE',
    },
  });

  console.log(`Admin user ready: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
