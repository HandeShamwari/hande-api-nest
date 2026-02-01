import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { PrismaService } from '../../shared/services/prisma.service';
import { SupabaseService } from '../../shared/services/supabase.service';

@Processor('subscriptions')
export class SubscriptionProcessor {
  private readonly logger = new Logger(SubscriptionProcessor.name);

  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
  ) {}

  /**
   * Check for subscriptions expiring in the next 2 hours
   */
  @Process('check-expiring')
  async handleCheckExpiring(job: Job) {
    this.logger.log(`Processing job ${job.id}: check-expiring`);

    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Find subscriptions expiring soon
    const expiring = await this.prisma.driver.findMany({
      where: {
        subscriptionExpiresAt: {
          gte: now,
          lte: twoHoursFromNow,
        },
        status: 'available',
      },
      include: {
        user: true,
      },
    });

    this.logger.log(`Found ${expiring.length} drivers with expiring subscriptions`);

    // Send notifications
    for (const driver of expiring) {
      try {
        await this.supabase.notifyDriver(driver.id, {
          type: 'subscription_expiring',
          title: 'Subscription Expiring Soon',
          message: `Your $1 subscription expires in less than 2 hours. Renew now to keep accepting trips!`,
          data: {
            expiresAt: driver.subscriptionExpiresAt,
            driverId: driver.id,
          },
        });

        this.logger.debug(`Sent expiry warning to driver ${driver.id}`);
      } catch (error) {
        this.logger.error(`Failed to notify driver ${driver.id}: ${error.message}`);
      }
    }

    return { processed: expiring.length };
  }

  /**
   * Process expired subscriptions and set drivers to inactive
   */
  @Process('process-expired')
  async handleProcessExpired(job: Job) {
    this.logger.log(`Processing job ${job.id}: process-expired`);

    const now = new Date();
    const graceHours = 6;
    const graceEndTime = new Date(now.getTime() - graceHours * 60 * 60 * 1000);

    // Find drivers with expired subscriptions past grace period
    const expired = await this.prisma.driver.findMany({
      where: {
        subscriptionExpiresAt: {
          lt: graceEndTime,
        },
        status: {
          not: 'off_duty',
        },
      },
      include: {
        user: true,
      },
    });

    this.logger.log(`Found ${expired.length} drivers with expired subscriptions`);

    // Set drivers to inactive
    for (const driver of expired) {
      try {
        await this.prisma.driver.update({
          where: { id: driver.id },
          data: {
            status: 'off_duty',
          },
        });

        // Notify driver
        await this.supabase.notifyDriver(driver.id, {
          type: 'subscription_expired',
          title: 'Subscription Expired',
          message: 'Your subscription has expired. Renew now to start accepting trips again.',
          data: {
            driverId: driver.id,
            expiredAt: driver.subscriptionExpiresAt,
          },
        });

        this.logger.debug(`Set driver ${driver.id} to offline`);
      } catch (error) {
        this.logger.error(`Failed to process driver ${driver.id}: ${error.message}`);
      }
    }

    return { processed: expired.length };
  }
}
