import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { ConfigService } from '@nestjs/config';
import {
  SubscribeDriverDto,
  UpdateDriverProfileDto,
  UpdateDriverLocationDto,
  DriverStatsResponseDto,
} from '../dto/driver.dto';

@Injectable()
export class DriversService {
  private readonly dailyFeeAmount: number;
  private readonly graceHours: number;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.dailyFeeAmount = parseFloat(this.config.get('DAILY_FEE_AMOUNT', '1.00'));
    this.graceHours = parseInt(this.config.get('DAILY_FEE_GRACE_HOURS', '6'));
  }

  /**
   * Subscribe driver to daily fee service
   */
  async subscribe(userId: string, dto: SubscribeDriverDto) {
    // Get driver profile
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    // Check if driver has active subscription
    const now = new Date();
    const activeSubscription = await this.prisma.dailyFee.findFirst({
      where: {
        driverId: driver.id,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (activeSubscription) {
      throw new BadRequestException('You already have an active subscription');
    }

    // Create subscription payment record
    const amount = dto.amount || this.dailyFeeAmount;
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    const subscription = await this.prisma.dailyFee.create({
      data: {
        driverId: driver.id,
        amount,
        paidAt: now,
        expiresAt,
        status: 'paid',
      },
    });

    // Update driver status to available
    await this.prisma.driver.update({
      where: { id: driver.id },
      data: {
        status: 'available',
        subscriptionExpiresAt: expiresAt,
      },
    });

    return {
      message: 'Subscription successful',
      subscription: {
        id: subscription.id,
        amount: subscription.amount,
        expiresAt: subscription.expiresAt,
        status: subscription.status,
      },
    };
  }

  /**
   * Get driver subscription status
   */
  async getSubscriptionStatus(userId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
      include: {
        dailyFees: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const now = new Date();
    const isActive = driver.subscriptionExpiresAt && driver.subscriptionExpiresAt > now;
    
    // Check if in grace period
    let subscriptionStatus: 'active' | 'inactive' | 'grace_period' = 'inactive';
    if (isActive) {
      subscriptionStatus = 'active';
    } else if (driver.subscriptionExpiresAt) {
      const graceEndTime = new Date(driver.subscriptionExpiresAt.getTime() + this.graceHours * 60 * 60 * 1000);
      if (now < graceEndTime) {
        subscriptionStatus = 'grace_period';
      }
    }

    return {
      driverId: driver.id,
      status: subscriptionStatus,
      expiresAt: driver.subscriptionExpiresAt,
      canAcceptRides: subscriptionStatus === 'active' || subscriptionStatus === 'grace_period',
      recentPayments: driver.dailyFees.map(fee => ({
        id: fee.id,
        amount: fee.amount,
        paidAt: fee.paidAt,
        expiresAt: fee.expiresAt,
        status: fee.status,
      })),
    };
  }

  /**
   * Update driver profile
   */
  async updateProfile(userId: string, dto: UpdateDriverProfileDto) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const updated = await this.prisma.driver.update({
      where: { id: driver.id },
      data: {
        licenseNumber: dto.licenseNumber,
        licenseExpiryDate: dto.licenseExpiry ? new Date(dto.licenseExpiry) : undefined,
      },
    });

    return {
      message: 'Profile updated successfully',
      driver: {
        id: updated.id,
        licenseNumber: updated.licenseNumber,
        licenseExpiryDate: updated.licenseExpiryDate,
        status: updated.status,
      },
    };
  }

  /**
   * Update driver location (real-time tracking)
   */
  async updateLocation(userId: string, dto: UpdateDriverLocationDto) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    // Store location in DriverLocation table (time-series data)
    await this.prisma.driverLocation.create({
      data: {
        driverId: driver.id,
        latitude: dto.latitude,
        longitude: dto.longitude,
        heading: dto.heading,
        speed: dto.speed,
        recordedAt: new Date(),
      },
    });

    // Update driver's current location
    await this.prisma.driver.update({
      where: { id: driver.id },
      data: {
        currentLatitude: dto.latitude,
        currentLongitude: dto.longitude,
        lastLocationUpdate: new Date(),
      },
    });

    return {
      message: 'Location updated successfully',
      location: {
        latitude: dto.latitude,
        longitude: dto.longitude,
        heading: dto.heading,
        speed: dto.speed,
      },
    };
  }

  /**
   * Get driver stats and earnings
   */
  async getStats(userId: string): Promise<DriverStatsResponseDto> {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
      include: {
        trips: {
          where: {
            status: { in: ['completed', 'cancelled'] },
          },
        },
        dailyFees: {
          where: { status: 'paid' },
        },
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const completedTrips = driver.trips.filter(t => t.status === 'completed');
    const cancelledTrips = driver.trips.filter(t => t.status === 'cancelled');
    const totalEarnings = completedTrips.reduce((sum, trip) => sum + (trip.finalFare ? Number(trip.finalFare) : 0), 0);

    // Calculate subscription status
    const now = new Date();
    const isActive = driver.subscriptionExpiresAt && driver.subscriptionExpiresAt > now;
    let subscriptionStatus: 'active' | 'inactive' | 'grace_period' = 'inactive';
    
    if (isActive) {
      subscriptionStatus = 'active';
    } else if (driver.subscriptionExpiresAt) {
      const graceEndTime = new Date(driver.subscriptionExpiresAt.getTime() + this.graceHours * 60 * 60 * 1000);
      if (now < graceEndTime) {
        subscriptionStatus = 'grace_period';
      }
    }

    // Calculate current streak (consecutive days with subscription)
    const currentStreak = await this.calculateSubscriptionStreak(driver.id);

    return {
      totalTrips: driver.trips.length,
      completedTrips: completedTrips.length,
      cancelledTrips: cancelledTrips.length,
      totalEarnings,
      averageRating: Number(driver.averageRating) || 0,
      subscriptionStatus,
      subscriptionExpiresAt: driver.subscriptionExpiresAt,
      currentStreak,
    };
  }

  /**
   * Calculate consecutive days of active subscription
   */
  private async calculateSubscriptionStreak(driverId: string): Promise<number> {
    const fees = await this.prisma.dailyFee.findMany({
      where: {
        driverId,
        status: 'paid',
      },
      orderBy: { paidAt: 'desc' },
    });

    if (fees.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const fee of fees) {
      if (!fee.paidAt) continue;
      const feeDate = new Date(fee.paidAt);
      feeDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((currentDate.getTime() - feeDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === streak) {
        streak++;
        currentDate = feeDate;
      } else if (daysDiff > streak) {
        break;
      }
    }

    return streak;
  }

  /**
   * Get driver profile
   */
  async getProfile(userId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        vehicles: true,
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    return {
      id: driver.id,
      user: driver.user,
      licenseNumber: driver.licenseNumber,
      licenseExpiryDate: driver.licenseExpiryDate,
      rating: Number(driver.averageRating),
      totalTrips: driver.totalTrips,
      status: driver.status,
      subscriptionExpiresAt: driver.subscriptionExpiresAt,
      currentLocation: driver.currentLatitude && driver.currentLongitude ? {
        latitude: Number(driver.currentLatitude),
        longitude: Number(driver.currentLongitude),
      } : null,
      vehicles: driver.vehicles,
    };
  }
}
