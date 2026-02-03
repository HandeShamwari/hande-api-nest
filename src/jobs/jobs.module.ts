import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import Redis from 'ioredis';
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
        const redisUrl = configService.get('REDIS_URL');
        
        if (redisUrl) {
          // Parse Redis URL for Upstash (requires TLS)
          const url = new URL(redisUrl);
          const isSecure = url.protocol === 'rediss:';
          
          console.log(`[Bull] Connecting to Redis at ${url.hostname}:${url.port} (TLS: ${isSecure})`);
          
          // Base Redis options for Upstash
          const redisOptions = {
            host: url.hostname,
            port: parseInt(url.port) || 6379,
            username: url.username || 'default',
            password: url.password,
            maxRetriesPerRequest: null, // Required for Bull blocking operations
            enableOfflineQueue: true,
            connectTimeout: 10000,
            ...(isSecure && {
              tls: {
                rejectUnauthorized: false,
              },
            }),
          };
          
          return {
            // Use createClient to control ALL Bull Redis connections
            createClient: (type) => {
              console.log(`[Bull] Creating Redis client for: ${type}`);
              return new Redis(redisOptions);
            },
          };
        }
        
        // Fallback to individual env vars
        const redisTls = configService.get('REDIS_TLS', 'false') === 'true';
        const fallbackOptions = {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
          maxRetriesPerRequest: null,
          enableOfflineQueue: true,
          ...(redisTls && {
            tls: {
              rejectUnauthorized: false,
            },
          }),
        };
        
        return {
          createClient: () => new Redis(fallbackOptions),
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
