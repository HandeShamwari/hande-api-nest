import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hande.com' },
    update: {},
    create: {
      firstName: 'Hande',
      lastName: 'Admin',
      email: 'admin@hande.com',
      password: adminPassword,
      phone: '+263782549577',
      userType: 'admin',
      activeRole: 'admin',
      isActive: true,
    },
  });

  console.log('✅ Admin user created:', admin.email);
  console.log('');
  console.log('===========================================');
  console.log('🔐 ADMIN LOGIN CREDENTIALS');
  console.log('===========================================');
  console.log('Email:    admin@hande.com');
  console.log('Password: Admin123!');
  console.log('===========================================');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
