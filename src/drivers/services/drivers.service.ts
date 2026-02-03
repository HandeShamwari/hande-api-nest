import { Injectable, BadRequestException, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { SupabaseService } from '../../shared/services/supabase.service';
import { ConfigService } from '@nestjs/config';
import {
  SubscribeDriverDto,
  UpdateDriverProfileDto,
  UpdateDriverLocationDto,
  DriverStatsResponseDto,
  GoOnlineDto,
  GoOfflineDto,
  PayDailyFeeDto,
  DailyFeeHistoryQueryDto,
} from '../dto/driver.dto';
import { JobsService } from '../../jobs/services/jobs.service';

@Injectable()
export class DriversService {
  private readonly logger = new Logger(DriversService.name);
  private readonly dailyFeeAmount: number;
  private readonly graceHours: number;
  private readonly penaltyAmount: number;
  private realtimeGateway: any; // Lazy loaded

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private supabase: SupabaseService,
    @Inject(forwardRef(() => JobsService))
    private jobsService: JobsService,
  ) {
    this.dailyFeeAmount = parseFloat(this.config.get('DAILY_FEE_AMOUNT', '1.00'));
    this.graceHours = parseInt(this.config.get('DAILY_FEE_GRACE_HOURS', '6'));
    this.penaltyAmount = parseFloat(this.config.get('DAILY_FEE_PENALTY', '0.50'));
  }

  /**
   * Set realtime gateway (injected to avoid circular dependency)
   */
  setRealtimeGateway(gateway: any) {
    this.realtimeGateway = gateway;
  }

  // ============================================================================
  // STATUS MANAGEMENT
  // ============================================================================

  /**
   * Get current driver status
   */
  async getCurrentStatus(userId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
        trips: {
          where: {
            status: { in: ['driver_assigned', 'driver_en_route', 'driver_arrived', 'in_progress'] },
          },
          take: 1,
        },
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const now = new Date();
    const isSubscriptionActive = driver.subscriptionExpiresAt && driver.subscriptionExpiresAt > now;
    const isInGracePeriod = !isSubscriptionActive && driver.subscriptionExpiresAt && 
      new Date(driver.subscriptionExpiresAt.getTime() + this.graceHours * 60 * 60 * 1000) > now;

    return {
      driverId: driver.id,
      status: driver.status,
      isOnline: driver.status === 'available',
      isOnTrip: driver.status === 'on_trip',
      activeTrip: driver.trips[0] || null,
      canAcceptRides: (isSubscriptionActive || isInGracePeriod) && driver.status === 'available',
      subscriptionActive: isSubscriptionActive,
      subscriptionExpiresAt: driver.subscriptionExpiresAt,
      currentLocation: driver.currentLatitude && driver.currentLongitude ? {
        latitude: Number(driver.currentLatitude),
        longitude: Number(driver.currentLongitude),
        lastUpdate: driver.lastLocationUpdate,
      } : null,
    };
  }

  /**
   * Go online to accept ride requests
   */
  async goOnline(userId: string, dto: GoOnlineDto) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
      include: {
        vehicles: {
          where: { isActive: true, status: 'approved' },
        },
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    // Check subscription status
    const now = new Date();
    const isSubscriptionActive = driver.subscriptionExpiresAt && driver.subscriptionExpiresAt > now;
    const isInGracePeriod = !isSubscriptionActive && driver.subscriptionExpiresAt && 
      new Date(driver.subscriptionExpiresAt.getTime() + this.graceHours * 60 * 60 * 1000) > now;

    if (!isSubscriptionActive && !isInGracePeriod) {
      throw new BadRequestException('Your subscription has expired. Please subscribe to go online.');
    }

    // Check if driver has an active approved vehicle
    if (driver.vehicles.length === 0) {
      throw new BadRequestException('You need at least one approved active vehicle to go online.');
    }

    // Check if already online
    if (driver.status === 'available') {
      return {
        message: 'You are already online',
        status: 'available',
      };
    }

    // Check if on trip (can't go offline manually)
    if (driver.status === 'on_trip') {
      throw new BadRequestException('Cannot change status while on an active trip');
    }

    // Update driver status and location if provided
    const updateData: any = {
      status: 'available',
    };

    if (dto.latitude && dto.longitude) {
      updateData.currentLatitude = dto.latitude;
      updateData.currentLongitude = dto.longitude;
      updateData.lastLocationUpdate = now;
    }

    await this.prisma.driver.update({
      where: { id: driver.id },
      data: updateData,
    });

    // Broadcast status change via Supabase
    try {
      await this.supabase.broadcastDriverStatus(driver.id, 'available');
    } catch (error) {
      this.logger.warn(`Failed to broadcast status: ${error.message}`);
    }

    return {
      message: 'You are now online and can receive ride requests',
      status: 'available',
      subscriptionWarning: isInGracePeriod ? 'Your subscription has expired. You are in grace period.' : null,
    };
  }

  /**
   * Go offline to stop accepting rides
   */
  async goOffline(userId: string, dto: GoOfflineDto) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    // Check if on trip
    if (driver.status === 'on_trip') {
      throw new BadRequestException('Cannot go offline while on an active trip. Please complete the trip first.');
    }

    // Check if already offline
    if (driver.status === 'off_duty') {
      return {
        message: 'You are already offline',
        status: 'off_duty',
      };
    }

    await this.prisma.driver.update({
      where: { id: driver.id },
      data: { status: 'off_duty' },
    });

    // Broadcast status change
    try {
      await this.supabase.broadcastDriverStatus(driver.id, 'off_duty');
    } catch (error) {
      this.logger.warn(`Failed to broadcast status: ${error.message}`);
    }

    return {
      message: 'You are now offline',
      status: 'off_duty',
      reason: dto.reason || 'User requested',
    };
  }

  // ============================================================================
  // DAILY FEE MANAGEMENT
  // ============================================================================

  /**
   * Get daily fee status
   */
  async getDailyFeeStatus(userId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
      include: {
        dailyFees: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // Check for today's fee
    const todayFee = await this.prisma.dailyFee.findFirst({
      where: {
        driverId: driver.id,
        feeDate: {
          gte: todayStart,
        },
      },
    });

    // Calculate status
    const isSubscriptionActive = driver.subscriptionExpiresAt && driver.subscriptionExpiresAt > now;
    const isInGracePeriod = !isSubscriptionActive && driver.subscriptionExpiresAt && 
      new Date(driver.subscriptionExpiresAt.getTime() + this.graceHours * 60 * 60 * 1000) > now;

    let status: 'paid' | 'pending' | 'grace_period' | 'overdue' = 'pending';
    let canAcceptRides = false;

    if (todayFee?.status === 'paid') {
      status = 'paid';
      canAcceptRides = true;
    } else if (isInGracePeriod) {
      status = 'grace_period';
      canAcceptRides = true;
    } else if (!isSubscriptionActive && !isInGracePeriod) {
      status = 'overdue';
      canAcceptRides = false;
    }

    // Calculate unpaid days
    const unpaidFees = await this.prisma.dailyFee.count({
      where: {
        driverId: driver.id,
        status: { in: ['pending', 'overdue', 'grace_period'] },
      },
    });

    // Calculate penalty if overdue
    const penaltyAmount = status === 'overdue' ? unpaidFees * this.penaltyAmount : 0;

    return {
      status,
      todayPaid: todayFee?.status === 'paid',
      canAcceptRides,
      dailyFeeAmount: this.dailyFeeAmount,
      unpaidDays: unpaidFees,
      totalOwed: unpaidFees * this.dailyFeeAmount + penaltyAmount,
      penaltyAmount,
      subscriptionExpiresAt: driver.subscriptionExpiresAt,
      graceHours: this.graceHours,
      lastPayment: driver.dailyFees[0] || null,
    };
  }

  /**
   * Pay daily fee
   */
  async payDailyFee(userId: string, dto: PayDailyFeeDto) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const days = dto.days || 1;
    const now = new Date();
    const totalAmount = days * this.dailyFeeAmount;

    // Check wallet balance (simulated - in production, integrate with payment gateway)
    if (Number(driver.walletBalance) < totalAmount) {
      throw new BadRequestException(
        `Insufficient wallet balance. Required: $${totalAmount.toFixed(2)}, Available: $${Number(driver.walletBalance).toFixed(2)}`
      );
    }

    // Create subscription payments for each day
    const subscriptions: Array<{ id: string; amount: any; expiresAt: Date | null }> = [];
    let currentExpiry = driver.subscriptionExpiresAt && driver.subscriptionExpiresAt > now 
      ? new Date(driver.subscriptionExpiresAt) 
      : now;

    for (let i = 0; i < days; i++) {
      const expiresAt = new Date(currentExpiry.getTime() + 24 * 60 * 60 * 1000);
      
      const fee = await this.prisma.dailyFee.create({
        data: {
          driverId: driver.id,
          amount: this.dailyFeeAmount,
          feeDate: new Date(currentExpiry),
          paidAt: now,
          expiresAt,
          status: 'paid',
          paymentMethodId: dto.paymentMethodId,
        },
      });
      
      subscriptions.push(fee);
      currentExpiry = expiresAt;
    }

    // Update driver
    const newWalletBalance = Number(driver.walletBalance) - totalAmount;
    await this.prisma.driver.update({
      where: { id: driver.id },
      data: {
        walletBalance: newWalletBalance,
        subscriptionExpiresAt: currentExpiry,
        status: driver.status === 'suspended' ? 'off_duty' : driver.status,
        dailyFeeStatus: 'paid',
        dailyFeePaidAt: now,
      },
    });

    // Schedule expiry warning
    try {
      await this.jobsService.scheduleExpiryWarning(driver.id, currentExpiry);
    } catch (error) {
      this.logger.warn(`Failed to schedule expiry warning: ${error.message}`);
    }

    return {
      message: `Successfully paid for ${days} day(s)`,
      totalPaid: totalAmount,
      newWalletBalance,
      subscriptionExpiresAt: currentExpiry,
      subscriptions: subscriptions.map(s => ({
        id: s.id,
        amount: s.amount,
        expiresAt: s.expiresAt,
      })),
    };
  }

  /**
   * Get daily fee payment history
   */
  async getDailyFeeHistory(userId: string, query: DailyFeeHistoryQueryDto) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const where: any = { driverId: driver.id };

    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate || query.endDate) {
      where.feeDate = {};
      if (query.startDate) {
        where.feeDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.feeDate.lte = new Date(query.endDate);
      }
    }

    const fees = await this.prisma.dailyFee.findMany({
      where,
      orderBy: { feeDate: 'desc' },
      take: 100,
    });

    // Calculate summary
    const totalPaid = fees
      .filter(f => f.status === 'paid')
      .reduce((sum, f) => sum + Number(f.amount), 0);

    return {
      history: fees.map(f => ({
        id: f.id,
        amount: Number(f.amount),
        penaltyAmount: Number(f.penaltyAmount),
        totalAmount: Number(f.totalAmount),
        status: f.status,
        feeDate: f.feeDate,
        paidAt: f.paidAt,
        expiresAt: f.expiresAt,
      })),
      summary: {
        totalRecords: fees.length,
        totalPaid,
        totalPending: fees.filter(f => f.status === 'pending').length,
        totalOverdue: fees.filter(f => f.status === 'overdue').length,
      },
    };
  }

  // ============================================================================
  // EARNINGS
  // ============================================================================

  /**
   * Get detailed earnings breakdown
   */
  async getEarnings(userId: string, period?: 'today' | 'week' | 'month' | 'all') {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Get completed trips in period
    const trips = await this.prisma.trip.findMany({
      where: {
        driverId: driver.id,
        status: 'completed',
        completedAt: { gte: startDate },
      },
      orderBy: { completedAt: 'desc' },
    });

    // Get daily fees paid in period
    const feesPaid = await this.prisma.dailyFee.findMany({
      where: {
        driverId: driver.id,
        status: 'paid',
        paidAt: { gte: startDate },
      },
    });

    // Calculate earnings
    const grossEarnings = trips.reduce((sum, t) => sum + (Number(t.finalFare) || 0), 0);
    const totalFees = feesPaid.reduce((sum, f) => sum + Number(f.amount), 0);
    const netEarnings = grossEarnings - totalFees;

    // Group by day for chart data
    const dailyEarnings: { date: string; earnings: number; trips: number }[] = [];
    const tripsByDay = new Map<string, { earnings: number; count: number }>();

    trips.forEach(trip => {
      if (trip.completedAt) {
        const dateStr = trip.completedAt.toISOString().split('T')[0];
        const existing = tripsByDay.get(dateStr) || { earnings: 0, count: 0 };
        existing.earnings += Number(trip.finalFare) || 0;
        existing.count += 1;
        tripsByDay.set(dateStr, existing);
      }
    });

    tripsByDay.forEach((value, date) => {
      dailyEarnings.push({
        date,
        earnings: value.earnings,
        trips: value.count,
      });
    });

    return {
      period: period || 'all',
      grossEarnings,
      totalFees,
      netEarnings,
      tripCount: trips.length,
      averagePerTrip: trips.length > 0 ? grossEarnings / trips.length : 0,
      walletBalance: Number(driver.walletBalance),
      dailyEarnings: dailyEarnings.sort((a, b) => a.date.localeCompare(b.date)),
    };
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
        feeDate: now,
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

    // Schedule expiry warning (2 hours before expiration)
    try {
      await this.jobsService.scheduleExpiryWarning(driver.id, expiresAt);
      this.logger.debug(`Scheduled expiry warning for driver ${driver.id}`);
    } catch (error) {
      this.logger.warn(`Failed to schedule expiry warning: ${error.message}`);
    }

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
    const updatedDriver = await this.prisma.driver.update({
      where: { id: driver.id },
      data: {
        currentLatitude: dto.latitude,
        currentLongitude: dto.longitude,
        lastLocationUpdate: new Date(),
      },
      include: {
        trips: {
          where: {
            status: { in: ['driver_assigned', 'in_progress'] },
          },
        },
      },
    });

    // Broadcast location update via Supabase Realtime
    const locationData = {
      driverId: driver.id,
      latitude: dto.latitude,
      longitude: dto.longitude,
      heading: dto.heading,
      speed: dto.speed,
      timestamp: new Date().toISOString(),
    };

    try {
      await this.supabase.broadcastDriverLocation(driver.id, locationData);
      this.logger.debug(`Broadcasted location for driver ${driver.id}`);
    } catch (error) {
      this.logger.warn(`Failed to broadcast location: ${error.message}`);
    }

    // If driver is on an active trip, broadcast to trip room
    const activeTrip = updatedDriver.trips[0];
    if (activeTrip && this.realtimeGateway) {
      try {
        this.realtimeGateway.server
          .to(`trip_${activeTrip.id}`)
          .emit('driver_location', locationData);
        this.logger.debug(`Broadcasted location to trip room: trip_${activeTrip.id}`);
      } catch (error) {
        this.logger.warn(`Failed to broadcast to trip room: ${error.message}`);
      }
    }

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
    try {
      this.logger.log(`Getting profile for userId: ${userId}`);
      
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

      this.logger.log(`Found driver: ${driver.id}`);

      return {
        id: driver.id,
        user: driver.user,
        licenseNumber: driver.licenseNumber,
        licenseExpiryDate: driver.licenseExpiryDate,
        rating: driver.averageRating ? Number(driver.averageRating) : 0,
        totalTrips: driver.totalTrips || 0,
        status: driver.status,
        subscriptionExpiresAt: driver.subscriptionExpiresAt,
        currentLocation: driver.currentLatitude && driver.currentLongitude ? {
          latitude: Number(driver.currentLatitude),
          longitude: Number(driver.currentLongitude),
        } : null,
        vehicles: driver.vehicles || [],
      };
    } catch (error) {
      this.logger.error(`Error getting driver profile: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ============================================================================
  // SHIFT MANAGEMENT
  // ============================================================================

  /**
   * Start a new shift
   */
  async startShift(userId: string, latitude?: number, longitude?: number) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    // Check for active shift
    const activeShift = await this.prisma.driverShift.findFirst({
      where: {
        driverId: driver.id,
        endTime: null,
      },
    });

    if (activeShift) {
      throw new BadRequestException('You already have an active shift');
    }

    // Check subscription
    if (driver.dailyFeeStatus !== 'paid') {
      throw new BadRequestException('Active subscription required to start a shift');
    }

    // Create shift
    const shift = await this.prisma.driverShift.create({
      data: {
        driverId: driver.id,
        startTime: new Date(),
        tripCount: 0,
        earnings: 0,
      },
    });

    // Update driver status
    await this.prisma.driver.update({
      where: { id: driver.id },
      data: {
        status: 'available',
        ...(latitude && { currentLatitude: latitude }),
        ...(longitude && { currentLongitude: longitude }),
        lastLocationUpdate: new Date(),
      },
    });

    this.logger.log(`Shift started: ${shift.id} for driver ${driver.id}`);

    return {
      id: shift.id,
      startTime: shift.startTime,
      isActive: true,
      message: 'Shift started successfully',
    };
  }

  /**
   * End current shift
   */
  async endShift(userId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const activeShift = await this.prisma.driverShift.findFirst({
      where: {
        driverId: driver.id,
        endTime: null,
      },
    });

    if (!activeShift) {
      throw new BadRequestException('No active shift found');
    }

    const endTime = new Date();
    const durationMinutes = Math.floor(
      (endTime.getTime() - activeShift.startTime.getTime()) / 60000
    );

    // Calculate shift earnings
    const shiftTrips = await this.prisma.trip.findMany({
      where: {
        driverId: driver.id,
        status: 'completed',
        completedAt: {
          gte: activeShift.startTime,
          lte: endTime,
        },
      },
    });

    const earnings = shiftTrips.reduce(
      (sum, trip) => sum + (trip.finalFare ? Number(trip.finalFare) : 0),
      0
    );

    // Update shift
    const updatedShift = await this.prisma.driverShift.update({
      where: { id: activeShift.id },
      data: {
        endTime,
        duration: durationMinutes,
        tripCount: shiftTrips.length,
        earnings,
      },
    });

    // Update driver status
    await this.prisma.driver.update({
      where: { id: driver.id },
      data: { status: 'off_duty' },
    });

    this.logger.log(`Shift ended: ${activeShift.id} for driver ${driver.id}`);

    return {
      id: updatedShift.id,
      startTime: updatedShift.startTime,
      endTime: updatedShift.endTime,
      duration: durationMinutes,
      tripCount: shiftTrips.length,
      earnings,
      message: 'Shift ended successfully',
    };
  }

  /**
   * Get current shift
   */
  async getCurrentShift(userId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const activeShift = await this.prisma.driverShift.findFirst({
      where: {
        driverId: driver.id,
        endTime: null,
      },
    });

    if (!activeShift) {
      return { active: false, shift: null };
    }

    // Get current shift stats
    const shiftTrips = await this.prisma.trip.count({
      where: {
        driverId: driver.id,
        status: 'completed',
        completedAt: { gte: activeShift.startTime },
      },
    });

    const shiftEarnings = await this.prisma.trip.aggregate({
      where: {
        driverId: driver.id,
        status: 'completed',
        completedAt: { gte: activeShift.startTime },
      },
      _sum: { finalFare: true },
    });

    const durationMinutes = Math.floor(
      (Date.now() - activeShift.startTime.getTime()) / 60000
    );

    return {
      active: true,
      shift: {
        id: activeShift.id,
        startTime: activeShift.startTime,
        duration: durationMinutes,
        tripCount: shiftTrips,
        earnings: Number(shiftEarnings._sum.finalFare || 0),
      },
    };
  }

  /**
   * Get shift history
   */
  async getShiftHistory(userId: string, limit: number = 20) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const shifts = await this.prisma.driverShift.findMany({
      where: {
        driverId: driver.id,
        endTime: { not: null },
      },
      orderBy: { startTime: 'desc' },
      take: limit,
    });

    return shifts.map((s) => ({
      id: s.id,
      startTime: s.startTime,
      endTime: s.endTime,
      duration: s.duration,
      tripCount: s.tripCount,
      earnings: Number(s.earnings || 0),
    }));
  }
}
