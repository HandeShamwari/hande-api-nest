import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { SubscriptionProcessor } from './processors/subscription.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { ReportProcessor } from './processors/report.processor';
import { JobsService } from './services/jobs.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        // Support both REDIS_URL and individual env vars
        const redisUrl = configService.get('REDIS_URL');
        
        if (redisUrl) {
          // Use Redis URL (e.g., rediss://default:password@host:6379)
          return {
            redis: redisUrl,
          };
        }
        
        // Fallback to individual env vars
        const redisTls = configService.get('REDIS_TLS', 'false') === 'true';
        return {
          redis: {
            host: configService.get('REDIS_HOST', 'localhost'),
            port: configService.get('REDIS_PORT', 6379),
            password: configService.get('REDIS_PASSWORD'),
            maxRetriesPerRequest: 3,
            enableOfflineQueue: false,
            ...(redisTls && {
              tls: {
                rejectUnauthorized: false,
              },
            }),
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: 'subscriptions' },
      { name: 'notifications' },
      { name: 'reports' },
    ),
    SharedModule,
  ],
  providers: [
    SubscriptionProcessor,
    NotificationProcessor,
    ReportProcessor,
    JobsService,
  ],
  exports: [JobsService, BullModule],
})
export class JobsModule {}
