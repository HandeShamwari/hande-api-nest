import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { Queue } from 'bull';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectQueue('subscriptions') private subscriptionQueue: Queue,
    @InjectQueue('notifications') private notificationQueue: Queue,
    @InjectQueue('reports') private reportQueue: Queue,
  ) {}

  /**
   * Check for expiring subscriptions every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkExpiringSubscriptions() {
    this.logger.log('Checking for expiring subscriptions...');
    
    await this.subscriptionQueue.add('check-expiring', {
      timestamp: new Date(),
    });
  }

  /**
   * Process expired subscriptions every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processExpiredSubscriptions() {
    this.logger.log('Processing expired subscriptions...');
    
    await this.subscriptionQueue.add('process-expired', {
      timestamp: new Date(),
    });
  }

  /**
   * Send daily earnings reports at 11 PM
   */
  @Cron('0 23 * * *')
  async sendDailyEarningsReports() {
    this.logger.log('Sending daily earnings reports...');
    
    await this.reportQueue.add('daily-earnings', {
      date: new Date(),
    });
  }

  /**
   * Send rating reminders 24 hours after trip completion
   */
  async scheduleRatingReminder(tripId: string, riderId: string) {
    await this.notificationQueue.add(
      'rating-reminder',
      { tripId, riderId },
      { delay: 24 * 60 * 60 * 1000 }, // 24 hours
    );
    
    this.logger.debug(`Scheduled rating reminder for trip ${tripId}`);
  }

  /**
   * Send subscription expiry warning 2 hours before
   */
  async scheduleExpiryWarning(driverId: string, expiresAt: Date) {
    const warningTime = new Date(expiresAt.getTime() - 2 * 60 * 60 * 1000); // 2 hours before
    const delay = warningTime.getTime() - Date.now();
    
    if (delay > 0) {
      await this.notificationQueue.add(
        'expiry-warning',
        { driverId, expiresAt },
        { delay },
      );
      
      this.logger.debug(`Scheduled expiry warning for driver ${driverId}`);
    }
  }

  /**
   * Clean up old location data (weekly)
   */
  @Cron('0 2 * * 0') // Every Sunday at 2 AM
  async cleanupOldLocationData() {
    this.logger.log('Cleaning up old location data...');
    
    await this.reportQueue.add('cleanup-locations', {
      olderThan: 90, // days
    });
  }

  /**
   * Archive completed trips (monthly)
   */
  @Cron('0 3 1 * *') // 1st of every month at 3 AM
  async archiveOldTrips() {
    this.logger.log('Archiving old trips...');
    
    await this.reportQueue.add('archive-trips', {
      olderThan: 90, // days
    });
  }

  /**
   * Send monthly reports to drivers
   */
  @Cron('0 9 1 * *') // 1st of every month at 9 AM
  async sendMonthlyReports() {
    this.logger.log('Sending monthly reports...');
    
    await this.reportQueue.add('monthly-reports', {
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
    });
  }
}
