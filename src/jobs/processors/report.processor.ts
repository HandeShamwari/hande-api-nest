import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { PrismaService } from '../../shared/services/prisma.service';
import { SupabaseService } from '../../shared/services/supabase.service';

@Processor('reports')
export class ReportProcessor {
  private readonly logger = new Logger(ReportProcessor.name);

  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
  ) {}

  /**
   * Generate and send daily earnings report to drivers
   */
  @Process('daily-earnings')
  async handleDailyEarnings(job: Job<{ date: Date }>) {
    this.logger.log(`Processing job ${job.id}: daily-earnings`);

    const { date } = job.data;
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all drivers with completed trips today
    const drivers = await this.prisma.driver.findMany({
      where: {
        trips: {
          some: {
            status: 'completed',
            completedAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        },
      },
      include: {
        user: true,
        trips: {
          where: {
            status: 'completed',
            completedAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        },
      },
    });

    this.logger.log(`Processing daily reports for ${drivers.length} drivers`);

    for (const driver of drivers) {
      try {
        const totalEarnings = driver.trips.reduce(
          (sum, trip) => sum + (trip.finalFare ? Number(trip.finalFare) : 0),
          0,
        );
        const tripCount = driver.trips.length;
        const avgEarnings = tripCount > 0 ? totalEarnings / tripCount : 0;

        await this.supabase.notifyDriver(driver.id, {
          type: 'daily_report',
          title: 'Daily Earnings Report',
          message: `Today you completed ${tripCount} trips and earned $${totalEarnings.toFixed(2)}!`,
          data: {
            date: startOfDay.toISOString(),
            tripCount,
            totalEarnings,
            avgEarnings,
          },
        });

        this.logger.debug(`Sent daily report to driver ${driver.id}`);
      } catch (error) {
        this.logger.error(`Failed to send report to driver ${driver.id}: ${error.message}`);
      }
    }

    return { processed: drivers.length };
  }

  /**
   * Generate monthly report for drivers
   */
  @Process('monthly-reports')
  async handleMonthlyReports(job: Job<{ month: number; year: number }>) {
    this.logger.log(`Processing job ${job.id}: monthly-reports`);

    const { month, year } = job.data;
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const drivers = await this.prisma.driver.findMany({
      where: {
        trips: {
          some: {
            status: 'completed',
            completedAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        },
      },
      include: {
        user: true,
        trips: {
          where: {
            status: 'completed',
            completedAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        },
        dailyFees: {
          where: {
            feeDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
            status: 'paid',
          },
        },
      },
    });

    this.logger.log(`Processing monthly reports for ${drivers.length} drivers`);

    for (const driver of drivers) {
      try {
        const totalEarnings = driver.trips.reduce(
          (sum, trip) => sum + (trip.finalFare ? Number(trip.finalFare) : 0),
          0,
        );
        const tripCount = driver.trips.length;
        const subscriptionDays = driver.dailyFees.length;
        const subscriptionCost = subscriptionDays * 1.0; // $1 per day
        const netEarnings = totalEarnings - subscriptionCost;

        await this.supabase.notifyDriver(driver.id, {
          type: 'monthly_report',
          title: 'Monthly Summary',
          message: `This month: ${tripCount} trips, $${totalEarnings.toFixed(2)} earned, $${netEarnings.toFixed(2)} net profit!`,
          data: {
            month,
            year,
            tripCount,
            totalEarnings,
            subscriptionCost,
            netEarnings,
            subscriptionDays,
          },
        });

        this.logger.debug(`Sent monthly report to driver ${driver.id}`);
      } catch (error) {
        this.logger.error(`Failed to send monthly report to driver ${driver.id}: ${error.message}`);
      }
    }

    return { processed: drivers.length };
  }

  /**
   * Clean up old location data
   */
  @Process('cleanup-locations')
  async handleCleanupLocations(job: Job<{ olderThan: number }>) {
    this.logger.log(`Processing job ${job.id}: cleanup-locations`);

    const { olderThan } = job.data;
    const cutoffDate = new Date(Date.now() - olderThan * 24 * 60 * 60 * 1000);

    try {
      const result = await this.prisma.driverLocation.deleteMany({
        where: {
          recordedAt: {
            lt: cutoffDate,
          },
        },
      });

      this.logger.log(`Deleted ${result.count} old location records`);
      return { deleted: result.count };
    } catch (error) {
      this.logger.error(`Failed to cleanup locations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Archive old trips
   */
  @Process('archive-trips')
  async handleArchiveTrips(job: Job<{ olderThan: number }>) {
    this.logger.log(`Processing job ${job.id}: archive-trips`);

    const { olderThan } = job.data;
    const cutoffDate = new Date(Date.now() - olderThan * 24 * 60 * 60 * 1000);

    try {
      // Count trips to archive
      const count = await this.prisma.trip.count({
        where: {
          status: { in: ['completed', 'cancelled'] },
          completedAt: {
            lt: cutoffDate,
          },
        },
      });

      // In a real implementation, you'd move these to an archive table
      // For now, we'll just log the count
      this.logger.log(`Found ${count} trips ready for archival`);

      // TODO: Implement actual archival logic (e.g., move to archive table)

      return { archivable: count };
    } catch (error) {
      this.logger.error(`Failed to archive trips: ${error.message}`);
      throw error;
    }
  }
}
