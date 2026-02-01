import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../shared/services/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
        env: {
          nodeEnv: process.env.NODE_ENV,
          hasDatabase: !!process.env.DATABASE_URL,
          hasJwtSecret: !!process.env.JWT_SECRET,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
