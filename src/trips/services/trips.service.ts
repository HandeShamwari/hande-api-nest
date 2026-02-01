import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { CreateTripDto } from '../dto/create-trip.dto';
import { CancelTripDto } from '../dto/cancel-trip.dto';

@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);
  private realtimeGateway: any; // Lazy loaded to avoid circular dependency

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate fare based on distance
   * Base fare: $2
   * Per km: $0.50
   * Min fare: $2
   */
  private calculateFare(distanceKm: number): number {
    const baseFare = 2.0;
    const perKmRate = 0.5;
    const calculatedFare = baseFare + distanceKm * perKmRate;
    return Math.max(calculatedFare, baseFare);
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Create a new trip request
   */
  async createTrip(userId: string, dto: CreateTripDto) {
    try {
      // Verify rider exists
      const rider = await this.prisma.rider.findFirst({
        where: { userId },
      });

      if (!rider) {
        throw new BadRequestException('Rider profile not found');
      }

      // Calculate distance and fare
      const distance = this.calculateDistance(
        dto.startLatitude,
        dto.startLongitude,
        dto.endLatitude,
        dto.endLongitude,
      );

      const estimatedFare = this.calculateFare(distance);

      // Create trip
      const trip = await this.prisma.trip.create({
        data: {
          riderId: rider.id,
          startAddress: dto.startAddress,
          startLatitude: dto.startLatitude,
          startLongitude: dto.startLongitude,
          endAddress: dto.endAddress,
          endLatitude: dto.endLatitude,
          endLongitude: dto.endLongitude,
          pickupAddress: dto.startAddress,
          destinationAddress: dto.endAddress,
          distance: distance.toFixed(2),
          duration: 0, // Will be calculated when trip starts
          estimatedFare: estimatedFare.toFixed(2),
          status: 'pending',
          notes: dto.notes,
        },
        include: {
          rider: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      this.logger.log(`Trip created: ${trip.id} by rider ${rider.id}`);

      // Notify nearby drivers about new trip (will be handled by realtime gateway)
      if (this.realtimeGateway) {
        await this.realtimeGateway.broadcastToDrivers('trip:new', {
          tripId: trip.id,
          startAddress: trip.startAddress,
          endAddress: trip.endAddress,
          estimatedFare: parseFloat(trip.estimatedFare.toString()),
          distance: parseFloat(trip.distance.toString()),
        });
      }

      return {
        id: trip.id,
        status: trip.status,
        startAddress: trip.startAddress,
        endAddress: trip.endAddress,
        distance: parseFloat(trip.distance.toString()),
        estimatedFare: parseFloat(trip.estimatedFare.toString()),
        notes: trip.notes,
        createdAt: trip.createdAt,
        rider: trip.rider ? {
          id: trip.rider.id,
          user: trip.rider.user,
        } : null,
      };
    } catch (error) {
      this.logger.error(`Failed to create trip: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get trip details (alias for getTripById)
   */
  async getTrip(tripId: string, userId: string) {
    return this.getTripById(tripId, userId);
  }

  /**
   * Get trip details by ID
   */
  async getTripById(tripId: string, userId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        rider: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        driver: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
            vehicles: {
              where: { status: 'approved' },
              take: 1,
            },
          },
        },
        bids: {
          include: {
            driver: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
                vehicles: {
                  where: { status: 'approved' },
                  take: 1,
                },
              },
            },
          },
          orderBy: {
            amount: 'asc',
          },
        },
      },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    // Verify user has access to this trip
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      throw new ForbiddenException('User not found');
    }
    
    if (user.userType === 'rider') {
      const rider = await this.prisma.rider.findFirst({ where: { userId } });
      if (trip.riderId !== rider?.id) {
        throw new ForbiddenException('You do not have access to this trip');
      }
    } else if (user.userType === 'driver') {
      const driver = await this.prisma.driver.findFirst({ where: { userId } });
      // Driver can access if they are assigned or have bid
      const hasBid = trip.bids.some(bid => bid.driverId === driver?.id);
      if (trip.driverId !== driver?.id && !hasBid && trip.status !== 'pending') {
        throw new ForbiddenException('You do not have access to this trip');
      }
    }

    return trip;
  }

  /**
   * Get nearby trip requests for drivers
   */
  async getNearbyTrips(userId: string, radius: number = 10) {
    try {
      // Get driver profile
      const driver = await this.prisma.driver.findFirst({
        where: { userId },
      });

      if (!driver) {
        throw new BadRequestException('Driver profile not found');
      }

      // Check subscription (check dailyFeeStatus instead of subscriptionStatus)
      if (driver.dailyFeeStatus !== 'paid') {
        throw new BadRequestException(
          'Active subscription required to view trip requests',
        );
      }

      // Get driver's current location
      if (!driver.currentLatitude || !driver.currentLongitude) {
        throw new BadRequestException(
          'Please update your location to view nearby trips',
        );
      }

      // Get pending trips
      const allTrips = await this.prisma.trip.findMany({
        where: {
          status: 'pending',
        },
        include: {
          rider: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          bids: {
            where: {
              driverId: driver.id,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Filter by distance
      const nearbyTrips = allTrips
        .map((trip) => {
          const distance = this.calculateDistance(
            parseFloat(driver.currentLatitude!.toString()),
            parseFloat(driver.currentLongitude!.toString()),
            parseFloat(trip.startLatitude.toString()),
            parseFloat(trip.startLongitude.toString()),
          );

          return {
            ...trip,
            distanceFromDriver: distance,
            hasBid: trip.bids.length > 0,
          };
        })
        .filter((trip) => trip.distanceFromDriver <= radius)
        .sort((a, b) => a.distanceFromDriver - b.distanceFromDriver);

      return nearbyTrips.map((trip) => ({
        id: trip.id,
        startAddress: trip.startAddress,
        endAddress: trip.endAddress,
        distance: parseFloat(trip.distance.toString()),
        estimatedFare: parseFloat(trip.estimatedFare.toString()),
        distanceFromDriver: parseFloat(trip.distanceFromDriver.toFixed(2)),
        hasBid: trip.hasBid,
        createdAt: trip.createdAt,
        rider: {
          firstName: trip.rider?.user.firstName || 'Unknown',
          rating: trip.rider ? parseFloat(trip.rider.rating.toString()) : 0,
        },
      }));
    } catch (error) {
      this.logger.error(
        `Failed to get nearby trips: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Driver accepts trip directly (no bidding)
   */
  async acceptTrip(tripId: string, userId: string) {
    try {
      const driver = await this.prisma.driver.findFirst({
        where: { userId },
        include: { vehicles: { where: { status: 'approved' }, take: 1 } },
      });

      if (!driver) {
        throw new BadRequestException('Driver profile not found');
      }

      if (driver.dailyFeeStatus !== 'paid') {
        throw new BadRequestException('Active subscription required');
      }

      if (!driver.vehicles || driver.vehicles.length === 0) {
        throw new BadRequestException('Please add and activate a vehicle first');
      }

      const trip = await this.prisma.trip.findUnique({
        where: { id: tripId },
      });

      if (!trip) {
        throw new NotFoundException('Trip not found');
      }

      if (trip.status !== 'pending') {
        throw new BadRequestException('Trip is no longer available');
      }

      // Update trip
      const updatedTrip = await this.prisma.trip.update({
        where: { id: tripId },
        data: {
          driverId: driver.id,
          vehicleId: driver.vehicles[0].id,
          finalFare: trip.estimatedFare,
          status: 'driver_assigned',
          driverAssignedAt: new Date(),
        },
        include: {
          rider: {
            include: {
              user: true,
            },
          },
          driver: {
            include: {
              user: true,
              vehicles: { where: { status: 'approved' }, take: 1 },
            },
          },
        },
      });

      // Broadcast trip status update
      if (this.realtimeGateway && updatedTrip.driver && updatedTrip.rider) {
        try {
          await this.realtimeGateway.broadcastTripStatus(tripId, 'driver_assigned', {
            driverId: driver.id,
            driverName: `${updatedTrip.driver.user.firstName} ${updatedTrip.driver.user.lastName}`,
            vehicle: driver.vehicles[0],
          });

          // Notify rider
          await this.realtimeGateway.notifyUser(updatedTrip.rider.userId, 'rider', {
            type: 'trip_accepted',
            title: 'Driver Assigned',
            message: `${updatedTrip.driver.user.firstName} is on the way!`,
            data: { tripId, driverId: driver.id },
          });
        } catch (error) {
          this.logger.warn(`Failed to broadcast trip acceptance: ${error.message}`);
        }
      }

      this.logger.log(`Trip ${tripId} accepted by driver ${driver.id}`);

      return updatedTrip;
    } catch (error) {
      this.logger.error(
        `Failed to accept trip: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Update trip status (start, complete, cancel)
   */
  async updateTripStatus(tripId: string, userId: string, dto: any) {
    const { status, reason } = dto;

    switch (status) {
      case 'in_progress':
        return this.startTrip(tripId, userId);
      case 'completed':
        return this.completeTrip(tripId, userId);
      case 'cancelled':
        return this.cancelTrip(tripId, userId, { reason, cancelledBy: 'driver' });
      default:
        throw new BadRequestException(`Invalid status: ${status}`);
    }
  }

  /**
   * Driver starts trip
   */
  async startTrip(tripId: string, userId: string) {
    const driver = await this.prisma.driver.findFirst({
      where: { userId },
    });

    if (!driver) {
      throw new BadRequestException('Driver profile not found');
    }

    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.driverId !== driver.id) {
      throw new ForbiddenException('You are not assigned to this trip');
    }

    if (trip.status !== 'driver_assigned' && trip.status !== 'driver_arrived') {
      throw new BadRequestException('Trip cannot be started');
    }

    const updatedTrip = await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        status: 'in_progress',
        startedAt: new Date(),
      },
    });

    this.logger.log(`Trip ${tripId} started by driver ${driver.id}`);

    // Broadcast trip status
    if (this.realtimeGateway) {
      await this.realtimeGateway.broadcastTripStatus(tripId, 'in_progress', {
        startedAt: updatedTrip.startedAt,
      });
    }

    return updatedTrip;
  }

  /**
   * Complete trip
   */
  async completeTrip(tripId: string, userId: string) {
    const driver = await this.prisma.driver.findFirst({
      where: { userId },
    });

    if (!driver) {
      throw new BadRequestException('Driver profile not found');
    }

    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        rider: {
          include: { user: true },
        },
      },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.driverId !== driver.id) {
      throw new ForbiddenException('You are not assigned to this trip');
    }

    if (trip.status !== 'in_progress') {
      throw new BadRequestException('Trip is not in progress');
    }

    const updatedTrip = await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
      include: {
        rider: {
          include: {
            user: true,
          },
        },
        driver: {
          include: {
            user: true,
            vehicles: { where: { status: 'approved' }, take: 1 },
          },
        },
      },
    });

    this.logger.log(`Trip ${tripId} completed by driver ${driver.id}`);

    // Broadcast trip completion
    if (this.realtimeGateway && updatedTrip.rider) {
      await this.realtimeGateway.broadcastTripStatus(tripId, 'completed', {
        completedAt: updatedTrip.completedAt,
        finalFare: updatedTrip.finalFare,
      });

      // Notify rider
      await this.realtimeGateway.notifyUser(updatedTrip.rider.userId, 'rider', {
        type: 'trip_completed',
        title: 'Trip Completed',
        message: 'Your trip has been completed. Please rate your driver.',
        data: { tripId, finalFare: updatedTrip.finalFare },
      });
    }

    return updatedTrip;
  }

  /**
   * Cancel trip
   */
  async cancelTrip(tripId: string, userId: string, cancelTripDto: CancelTripDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        rider: true,
        driver: true,
      },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    // Verify user has permission to cancel
    if (user.userType === 'rider') {
      const rider = await this.prisma.rider.findFirst({ where: { userId } });
      if (trip.riderId !== rider?.id) {
        throw new ForbiddenException('You cannot cancel this trip');
      }
    // Broadcast cancellation
    if (this.realtimeGateway) {
      await this.realtimeGateway.broadcastTripStatus(tripId, 'cancelled', {
        cancelledBy: cancelTripDto.cancelledBy || user.userType,
        reason: cancelTripDto.reason,
      });
    }

    } else if (user.userType === 'driver') {
      const driver = await this.prisma.driver.findFirst({ where: { userId } });
      if (trip.driverId !== driver?.id) {
        throw new ForbiddenException('You cannot cancel this trip');
      }
    }

    if (trip.status === 'completed' || trip.status === 'cancelled') {
      throw new BadRequestException('Trip cannot be cancelled');
    }

    const updatedTrip = await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: cancelTripDto.reason,
        cancelledBy: cancelTripDto.cancelledBy || user.userType,
      },
    });

    this.logger.log(`Trip ${tripId} cancelled by ${user.userType} ${userId}`);

    return updatedTrip;
  }

  /**
   * Get rider's trips
   */
  async getRiderTrips(userId: string, status?: string) {
    const rider = await this.prisma.rider.findFirst({
      where: { userId },
    });

    if (!rider) {
      throw new BadRequestException('Rider profile not found');
    }

    const trips = await this.prisma.trip.findMany({
      where: {
        riderId: rider.id,
        ...(status && { status: status as any }),
      },
      include: {
        driver: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
            vehicles: { where: { status: 'approved' }, take: 1 },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    return trips;
  }

  /**
   * Get driver's trips
   */
  async getDriverTrips(userId: string, status?: string) {
    const driver = await this.prisma.driver.findFirst({
      where: { userId },
    });

    if (!driver) {
      throw new BadRequestException('Driver profile not found');
    }

    const trips = await this.prisma.trip.findMany({
      where: {
        driverId: driver.id,
        ...(status && { status: status as any }),
      },
      include: {
        rider: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        vehicle: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    return trips;
  }

  /**
   * Set realtime gateway (to avoid circular dependency)
   */
  setRealtimeGateway(gateway: any) {
    this.realtimeGateway = gateway;
  }
}
