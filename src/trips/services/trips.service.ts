import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { CreateTripDto } from '../dto/create-trip.dto';
import { UpdateTripStatusDto } from '../dto/update-trip-status.dto';

@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate estimated fare based on distance
   * Base fare: $2.00
   * Per km: $0.50
   */
  private calculateFare(distanceInKm: number): number {
    const baseFare = 2.0;
    const perKmRate = 0.5;
    return Number((baseFare + distanceInKm * perKmRate).toFixed(2));
  }

  /**
   * Calculate distance using Haversine formula
   * Returns distance in kilometers
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Create a new trip request
   * Only riders can create trips
   */
  async createTrip(riderId: string, dto: CreateTripDto) {
    try {
      // Verify rider exists
      const rider = await this.prisma.rider.findUnique({
        where: { userId: riderId },
      });

      if (!rider) {
        throw new NotFoundException('Rider profile not found');
      }

      // Calculate distance and estimated fare
      const distance = this.calculateDistance(
        dto.pickupLatitude,
        dto.pickupLongitude,
        dto.destinationLatitude,
        dto.destinationLongitude,
      );

      const estimatedFare = this.calculateFare(distance);

      // Create trip
      const trip = await this.prisma.trip.create({
        data: {
          riderId: rider.id,
          pickupLatitude: dto.pickupLatitude,
          pickupLongitude: dto.pickupLongitude,
          pickupAddress: dto.pickupAddress,
          destinationLatitude: dto.destinationLatitude,
          destinationLongitude: dto.destinationLongitude,
          destinationAddress: dto.destinationAddress,
          distance: Number(distance.toFixed(2)),
          estimatedFare,
          status: 'pending',
          notes: dto.notes,
          vehicleType: dto.vehicleType || 'sedan',
          passengerCount: dto.passengerCount || 1,
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

      this.logger.log(`Trip created: ${trip.id} by rider ${riderId}`);

      return {
        message: 'Trip request created successfully',
        trip: {
          id: trip.id,
          status: trip.status,
          pickupAddress: trip.pickupAddress,
          destinationAddress: trip.destinationAddress,
          distance: trip.distance,
          estimatedFare: trip.estimatedFare,
          vehicleType: trip.vehicleType,
          passengerCount: trip.passengerCount,
          rider: {
            firstName: trip.rider.user.firstName,
            lastName: trip.rider.user.lastName,
            phone: trip.rider.user.phone,
          },
          createdAt: trip.createdAt,
        },
      };
    } catch (error) {
      this.logger.error(`Error creating trip: ${error.message}`);
      throw error;
    }
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
              where: { isActive: true },
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
    const isRider = trip.rider.userId === userId;
    const isDriver = trip.driver?.userId === userId;

    if (!isRider && !isDriver) {
      throw new ForbiddenException('You do not have access to this trip');
    }

    return trip;
  }

  /**
   * Get nearby trip requests for drivers
   * Returns pending trips within 10km radius
   */
  async getNearbyTrips(driverId: string) {
    try {
      // Get driver with current location
      const driver = await this.prisma.driver.findUnique({
        where: { userId: driverId },
        select: {
          id: true,
          currentLatitude: true,
          currentLongitude: true,
          status: true,
        },
      });

      if (!driver) {
        throw new NotFoundException('Driver profile not found');
      }

      if (!driver.currentLatitude || !driver.currentLongitude) {
        throw new BadRequestException('Driver location not available');
      }

      // Check if driver has active subscription
      const activeSubscription = await this.prisma.dailyFee.findFirst({
        where: {
          driverId: driver.id,
          status: 'paid',
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!activeSubscription) {
        throw new ForbiddenException(
          'Active subscription required to view trip requests',
        );
      }

      // Get all pending trips
      const trips = await this.prisma.trip.findMany({
        where: {
          status: 'pending',
        },
        include: {
          rider: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  phone: true,
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

      // Filter by distance (10km radius) and format response
      const nearbyTrips = trips
        .map((trip) => {
          const distance = this.calculateDistance(
            driver.currentLatitude,
            driver.currentLongitude,
            trip.pickupLatitude,
            trip.pickupLongitude,
          );

          return {
            ...trip,
            distanceFromDriver: Number(distance.toFixed(2)),
            alreadyBid: trip.bids.length > 0,
          };
        })
        .filter((trip) => trip.distanceFromDriver <= 10)
        .sort((a, b) => a.distanceFromDriver - b.distanceFromDriver);

      return nearbyTrips;
    } catch (error) {
      this.logger.error(`Error fetching nearby trips: ${error.message}`);
      throw error;
    }
  }

  /**
   * Driver accepts trip (without bidding)
   * For immediate acceptance at estimated fare
   */
  async acceptTrip(tripId: string, driverId: string) {
    try {
      const trip = await this.prisma.trip.findUnique({
        where: { id: tripId },
        include: {
          driver: true,
          bids: true,
        },
      });

      if (!trip) {
        throw new NotFoundException('Trip not found');
      }

      if (trip.status !== 'pending') {
        throw new BadRequestException('Trip is no longer available');
      }

      // Get driver details
      const driver = await this.prisma.driver.findUnique({
        where: { userId: driverId },
        include: {
          vehicles: {
            where: { isActive: true },
            take: 1,
          },
        },
      });

      if (!driver) {
        throw new NotFoundException('Driver profile not found');
      }

      // Check subscription
      const activeSubscription = await this.prisma.dailyFee.findFirst({
        where: {
          driverId: driver.id,
          status: 'paid',
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!activeSubscription) {
        throw new ForbiddenException(
          'Active subscription required to accept trips',
        );
      }

      if (driver.vehicles.length === 0) {
        throw new BadRequestException(
          'You must have an active vehicle to accept trips',
        );
      }

      // Update trip
      const updatedTrip = await this.prisma.trip.update({
        where: { id: tripId },
        data: {
          driverId: driver.id,
          vehicleId: driver.vehicles[0].id,
          status: 'accepted',
          finalFare: trip.estimatedFare,
          acceptedAt: new Date(),
        },
        include: {
          rider: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  phone: true,
                },
              },
            },
          },
          vehicle: true,
        },
      });

      this.logger.log(`Trip ${tripId} accepted by driver ${driverId}`);

      return {
        message: 'Trip accepted successfully',
        trip: updatedTrip,
      };
    } catch (error) {
      this.logger.error(`Error accepting trip: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update trip status (start, complete, cancel)
   */
  async updateTripStatus(
    tripId: string,
    userId: string,
    dto: UpdateTripStatusDto,
  ) {
    try {
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

      // Verify user is part of this trip
      const isRider = trip.rider.userId === userId;
      const isDriver = trip.driver?.userId === userId;

      if (!isRider && !isDriver) {
        throw new ForbiddenException('You do not have access to this trip');
      }

      // Validate status transitions
      if (dto.status === 'in_progress') {
        if (trip.status !== 'accepted') {
          throw new BadRequestException(
            'Trip must be accepted before starting',
          );
        }
        if (!isDriver) {
          throw new ForbiddenException('Only driver can start the trip');
        }
      }

      if (dto.status === 'completed') {
        if (trip.status !== 'in_progress') {
          throw new BadRequestException('Trip must be in progress to complete');
        }
        if (!isDriver) {
          throw new ForbiddenException('Only driver can complete the trip');
        }
      }

      if (dto.status === 'cancelled') {
        if (['completed', 'cancelled'].includes(trip.status)) {
          throw new BadRequestException('Cannot cancel this trip');
        }
      }

      // Update trip
      const updateData: any = {
        status: dto.status,
      };

      if (dto.status === 'in_progress') {
        updateData.startedAt = new Date();
      }

      if (dto.status === 'completed') {
        updateData.completedAt = new Date();
      }

      if (dto.status === 'cancelled') {
        updateData.cancelledAt = new Date();
        updateData.cancellationReason = dto.cancellationReason;
      }

      const updatedTrip = await this.prisma.trip.update({
        where: { id: tripId },
        data: updateData,
        include: {
          rider: {
            include: {
              user: {
                select: {
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
                  firstName: true,
                  lastName: true,
                  phone: true,
                },
              },
            },
          },
          vehicle: true,
        },
      });

      this.logger.log(`Trip ${tripId} status updated to ${dto.status}`);

      return {
        message: `Trip ${dto.status} successfully`,
        trip: updatedTrip,
      };
    } catch (error) {
      this.logger.error(`Error updating trip status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get rider's trip history
   */
  async getRiderTrips(riderId: string) {
    const rider = await this.prisma.rider.findUnique({
      where: { userId: riderId },
    });

    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    const trips = await this.prisma.trip.findMany({
      where: { riderId: rider.id },
      include: {
        driver: {
          include: {
            user: {
              select: {
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
      take: 50,
    });

    return trips;
  }

  /**
   * Get driver's trip history
   */
  async getDriverTrips(driverId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId: driverId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const trips = await this.prisma.trip.findMany({
      where: { driverId: driver.id },
      include: {
        rider: {
          include: {
            user: {
              select: {
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
      take: 50,
    });

    return trips;
  }
}
