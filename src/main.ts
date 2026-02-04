import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { PrismaService } from './shared/services/prisma.service';
import * as bcrypt from 'bcrypt';

async function seedAdminUser(prisma: PrismaService) {
  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { userType: 'admin' },
    });

    if (!existingAdmin) {
      console.log('🌱 No admin user found, creating default admin...');
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      const admin = await prisma.user.create({
        data: {
          firstName: 'Hande',
          lastName: 'Admin',
          email: 'admin@hande.com',
          password: hashedPassword,
          phone: '+263782549577',
          userType: 'admin',
          activeRole: 'admin',
          isActive: true,
        },
      });
      console.log('✅ Admin user created:', admin.email);
      console.log('🔐 Login: admin@hande.com / Admin123!');
    } else {
      console.log('✅ Admin user already exists:', existingAdmin.email);
    }
  } catch (error) {
    console.error('⚠️ Admin seed skipped:', error.message);
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  
  // Enable CORS
  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  
  // Global prefix
  app.setGlobalPrefix('api');
  
  // Seed admin user on startup using existing PrismaService
  const prisma = app.get(PrismaService);
  await seedAdminUser(prisma);
  
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  
  console.log(`🚀 Hande API (NestJS) running on: http://localhost:${port}/api`);
}
bootstrap();
