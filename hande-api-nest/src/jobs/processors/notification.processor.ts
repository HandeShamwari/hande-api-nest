import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { PrismaService } from '../../shared/services/prisma.service';
import { SupabaseService } from '../../shared/services/supabase.service';

@Processor('notifications')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
  ) {}

  /**
   * Send rating reminder to rider after trip completion
   */
  @Process('rating-reminder')
  async handleRatingReminder(job: Job<{ tripId: string; riderId: string }>) {
    this.logger.log(`Processing job ${job.id}: rating-reminder`);

    const { tripId, riderId } = job.data;

    try {
      // Check if trip exists and is completed
      const trip = await this.prisma.trip.findUnique({
        where: { id: tripId },
        include: {
          driver: {
            include: { user: true },
          },
        },
      });

      if (!trip) {
        this.logger.warn(`Trip ${tripId} not found`);
        return { skipped: true, reason: 'trip_not_found' };
      }

      // Check if rating already exists for this trip
      const existingRating = await this.prisma.driverRating.findFirst({
        where: { tripId },
      });

      if (existingRating) {
        this.logger.debug(`Trip ${tripId} already rated`);
        return { skipped: true, reason: 'already_rated' };
      }

      // Send reminder notification
      await this.supabase.notifyRider(riderId, {
        type: 'rating_reminder',
        title: 'Rate Your Trip',
        message: `How was your trip with ${trip.driver?.user.firstName}? Your feedback helps improve service.`,
        data: {
          tripId,
          driverId: trip.driverId,
        },
      });

      this.logger.log(`Sent rating reminder for trip ${tripId}`);
      return { sent: true };
    } catch (error) {
      this.logger.error(`Failed to send rating reminder: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send subscription expiry warning
   */
  @Process('expiry-warning')
  async handleExpiryWarning(job: Job<{ driverId: string; expiresAt: Date }>) {
    this.logger.log(`Processing job ${job.id}: expiry-warning`);

    const { driverId, expiresAt } = job.data;

    try {
      const driver = await this.prisma.driver.findUnique({
        where: { id: driverId },
        include: { user: true },
      });

      if (!driver) {
        return { skipped: true, reason: 'driver_not_found' };
      }

      // Check if still expires at the same time (subscription not renewed)
      if (driver.subscriptionExpiresAt?.getTime() === new Date(expiresAt).getTime()) {
        await this.supabase.notifyDriver(driverId, {
          type: 'subscription_expiring',
          title: 'Subscription Expiring Soon',
          message: 'Your $1 subscription expires in 2 hours. Renew now to keep accepting trips!',
          data: {
            expiresAt,
            driverId,
          },
        });

        this.logger.log(`Sent expiry warning to driver ${driverId}`);
        return { sent: true };
      }

      return { skipped: true, reason: 'subscription_renewed' };
    } catch (error) {
      this.logger.error(`Failed to send expiry warning: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send inactive driver notification (not used in 7 days)
   */
  @Process('inactive-driver')
  async handleInactiveDriver(job: Job<{ driverId: string }>) {
    this.logger.log(`Processing job ${job.id}: inactive-driver`);

    const { driverId } = job.data;

    try {
      const driver = await this.prisma.driver.findUnique({
        where: { id: driverId },
        include: {
          user: true,
          trips: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
            take: 1,
          },
        },
      });

      if (!driver) {
        return { skipped: true, reason: 'driver_not_found' };
      }

      // Check if driver has been active
      if (driver.trips.length === 0 && driver.lastLocationUpdate) {
        const daysSinceUpdate = Math.floor(
          (Date.now() - driver.lastLocationUpdate.getTime()) / (24 * 60 * 60 * 1000),
        );

        if (daysSinceUpdate >= 7) {
          await this.supabase.notifyDriver(driverId, {
            type: 'inactive_reminder',
            title: 'We Miss You!',
            message: "It's been a while since your last trip. Go online and start earning today!",
            data: {
              driverId,
              daysSinceActive: daysSinceUpdate,
            },
          });

          this.logger.log(`Sent inactive reminder to driver ${driverId}`);
          return { sent: true };
        }
      }

      return { skipped: true, reason: 'driver_active' };
    } catch (error) {
      this.logger.error(`Failed to send inactive reminder: ${error.message}`);
      throw error;
    }
  }
}
