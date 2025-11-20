import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './config/prisma.service';

@Controller()
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get('health')
  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message,
      };
    }
  }

  @Get()
  root() {
    return {
      name: 'Ad Review Software API',
      version: '1.0.0',
      status: 'running',
    };
  }
}
