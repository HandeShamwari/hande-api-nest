import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { CreateRatingDto, RatingStatsDto } from '../dto/rating.dto';

@Injectable()
export class RatingsService {
  private readonly logger = new Logger(RatingsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Rider rates a driver after trip completion
   */
  async rateDriver(userId: string, dto: CreateRatingDto) {
    // Get rider profile
    const rider = await this.prisma.rider.findUnique({
      where: { userId },
    });

    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    // Get trip
    const trip = await this.prisma.trip.findUnique({
      where: { id: dto.tripId },
      include: { driver: true },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.riderId !== rider.id) {
      throw new ForbiddenException('You can only rate your own trips');
    }

    if (trip.status !== 'completed') {
      throw new BadRequestException('Can only rate completed trips');
    }

    if (!trip.driverId) {
      throw new BadRequestException('No driver assigned to this trip');
    }

    // Check for existing rating
    const existingRating = await this.prisma.driverRating.findFirst({
      where: {
        tripId: dto.tripId,
        riderId: rider.id,
      },
    });

    if (existingRating) {
      throw new BadRequestException('You have already rated this trip');
    }

    // Create rating
    const rating = await this.prisma.driverRating.create({
      data: {
        driverId: trip.driverId,
        riderId: rider.id,
        tripId: dto.tripId,
        rating: dto.rating,
        feedback: dto.feedback,
      },
      include: {
        driver: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    // Update driver's average rating
    await this.updateDriverRating(trip.driverId);

    this.logger.log(
      `Rider ${rider.id} rated driver ${trip.driverId}: ${dto.rating} stars`,
    );

    return {
      id: rating.id,
      tripId: rating.tripId,
      rating: rating.rating,
      feedback: rating.feedback,
      createdAt: rating.createdAt,
      driver: {
        id: rating.driver.id,
        firstName: rating.driver.user.firstName,
        lastName: rating.driver.user.lastName,
      },
    };
  }

  /**
   * Get driver's ratings
   */
  async getDriverRatings(driverId: string, limit: number = 20) {
    const ratings = await this.prisma.driverRating.findMany({
      where: { driverId },
      include: {
        rider: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return ratings.map((r) => ({
      id: r.id,
      rating: r.rating,
      feedback: r.feedback,
      createdAt: r.createdAt,
      rider: {
        firstName: r.rider.user.firstName,
        lastName: r.rider.user.lastName.charAt(0) + '.', // Privacy
      },
    }));
  }

  /**
   * Get driver's rating stats
   */
  async getDriverRatingStats(driverId: string): Promise<RatingStatsDto> {
    const ratings = await this.prisma.driverRating.findMany({
      where: { driverId },
      select: { rating: true },
    });

    const totalRatings = ratings.length;
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    for (const r of ratings) {
      breakdown[r.rating as keyof typeof breakdown]++;
      sum += r.rating;
    }

    return {
      averageRating: totalRatings > 0 ? Math.round((sum / totalRatings) * 100) / 100 : 0,
      totalRatings,
      breakdown,
    };
  }

  /**
   * Get my ratings (as driver)
   */
  async getMyRatings(userId: string, limit: number = 20) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    return this.getDriverRatings(driver.id, limit);
  }

  /**
   * Get my rating stats (as driver)
   */
  async getMyRatingStats(userId: string): Promise<RatingStatsDto> {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    return this.getDriverRatingStats(driver.id);
  }

  /**
   * Update driver's average rating
   */
  private async updateDriverRating(driverId: string) {
    const stats = await this.getDriverRatingStats(driverId);

    await this.prisma.driver.update({
      where: { id: driverId },
      data: {
        rating: stats.averageRating,
        averageRating: stats.averageRating,
      },
    });
  }

  /**
   * Get rating for a specific trip
   */
  async getTripRating(tripId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const rating = await this.prisma.driverRating.findFirst({
      where: { tripId },
      include: {
        driver: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        rider: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!rating) {
      return null;
    }

    return {
      id: rating.id,
      tripId: rating.tripId,
      rating: rating.rating,
      feedback: rating.feedback,
      createdAt: rating.createdAt,
    };
  }
}
