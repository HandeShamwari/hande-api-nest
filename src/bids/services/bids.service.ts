import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { CreateBidDto } from '../dto/create-bid.dto';

@Injectable()
export class BidsService {
  private readonly logger = new Logger(BidsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Driver places a bid on a trip
   */
  async createBid(driverId: string, dto: CreateBidDto) {
    try {
      // Verify driver exists and has active subscription
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

      // Check active subscription
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
          'Active subscription required to place bids',
        );
      }

      if (driver.vehicles.length === 0) {
        throw new BadRequestException(
          'You must have an active vehicle to place bids',
        );
      }

      // Verify trip exists and is pending
      const trip = await this.prisma.trip.findUnique({
        where: { id: dto.tripId },
      });

      if (!trip) {
        throw new NotFoundException('Trip not found');
      }

      if (trip.status !== 'pending') {
        throw new BadRequestException('Trip is no longer accepting bids');
      }

      // Check if driver already bid on this trip
      const existingBid = await this.prisma.bid.findFirst({
        where: {
          tripId: dto.tripId,
          driverId: driver.id,
        },
      });

      if (existingBid) {
        throw new BadRequestException('You have already placed a bid on this trip');
      }

      // Validate bid amount (should be within reasonable range of estimated fare)
      const minBid = trip.estimatedFare * 0.7; // 30% below
      const maxBid = trip.estimatedFare * 1.5; // 50% above

      if (dto.amount < minBid || dto.amount > maxBid) {
        throw new BadRequestException(
          `Bid amount must be between $${minBid.toFixed(2)} and $${maxBid.toFixed(2)}`,
        );
      }

      // Create bid
      const bid = await this.prisma.bid.create({
        data: {
          tripId: dto.tripId,
          driverId: driver.id,
          vehicleId: driver.vehicles[0].id,
          amount: dto.amount,
          estimatedTime: dto.estimatedTime,
          message: dto.message,
          status: 'pending',
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
            },
          },
          vehicle: true,
        },
      });

      this.logger.log(
        `Bid placed: $${dto.amount} by driver ${driverId} on trip ${dto.tripId}`,
      );

      return {
        message: 'Bid placed successfully',
        bid: {
          id: bid.id,
          amount: bid.amount,
          estimatedTime: bid.estimatedTime,
          message: bid.message,
          status: bid.status,
          driver: {
            firstName: bid.driver.user.firstName,
            lastName: bid.driver.user.lastName,
            rating: bid.driver.rating,
          },
          vehicle: {
            make: bid.vehicle.make,
            model: bid.vehicle.model,
            color: bid.vehicle.color,
            licensePlate: bid.vehicle.licensePlate,
          },
          createdAt: bid.createdAt,
        },
      };
    } catch (error) {
      this.logger.error(`Error creating bid: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all bids for a trip
   */
  async getTripBids(tripId: string, userId: string) {
    try {
      // Verify trip exists
      const trip = await this.prisma.trip.findUnique({
        where: { id: tripId },
        include: {
          rider: true,
        },
      });

      if (!trip) {
        throw new NotFoundException('Trip not found');
      }

      // Only rider who created the trip can view bids
      if (trip.rider.userId !== userId) {
        throw new ForbiddenException('You do not have access to these bids');
      }

      const bids = await this.prisma.bid.findMany({
        where: {
          tripId,
          status: 'pending',
        },
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
          amount: 'asc', // Show lowest bids first
        },
      });

      return bids.map((bid) => ({
        id: bid.id,
        amount: bid.amount,
        estimatedTime: bid.estimatedTime,
        message: bid.message,
        driver: {
          id: bid.driver.id,
          firstName: bid.driver.user.firstName,
          lastName: bid.driver.user.lastName,
          phone: bid.driver.user.phone,
          rating: bid.driver.rating,
          totalTrips: bid.driver.totalTrips,
        },
        vehicle: {
          make: bid.vehicle.make,
          model: bid.vehicle.model,
          year: bid.vehicle.year,
          color: bid.vehicle.color,
          licensePlate: bid.vehicle.licensePlate,
          type: bid.vehicle.type,
        },
        createdAt: bid.createdAt,
      }));
    } catch (error) {
      this.logger.error(`Error fetching trip bids: ${error.message}`);
      throw error;
    }
  }

  /**
   * Rider accepts a bid
   */
  async acceptBid(bidId: string, riderId: string) {
    try {
      // Get bid with related data
      const bid = await this.prisma.bid.findUnique({
        where: { id: bidId },
        include: {
          trip: {
            include: {
              rider: true,
            },
          },
          driver: true,
          vehicle: true,
        },
      });

      if (!bid) {
        throw new NotFoundException('Bid not found');
      }

      // Verify rider owns this trip
      if (bid.trip.rider.userId !== riderId) {
        throw new ForbiddenException('You do not have access to this bid');
      }

      // Verify trip is still pending
      if (bid.trip.status !== 'pending') {
        throw new BadRequestException('Trip is no longer available');
      }

      // Verify bid is still pending
      if (bid.status !== 'pending') {
        throw new BadRequestException('Bid is no longer available');
      }

      // Use transaction to:
      // 1. Update trip with accepted bid
      // 2. Mark this bid as accepted
      // 3. Mark all other bids as rejected
      const result = await this.prisma.$transaction(async (tx) => {
        // Update trip
        const updatedTrip = await tx.trip.update({
          where: { id: bid.tripId },
          data: {
            driverId: bid.driverId,
            vehicleId: bid.vehicleId,
            status: 'accepted',
            finalFare: bid.amount,
            acceptedAt: new Date(),
          },
        });

        // Mark accepted bid
        await tx.bid.update({
          where: { id: bidId },
          data: {
            status: 'accepted',
            acceptedAt: new Date(),
          },
        });

        // Reject all other bids
        await tx.bid.updateMany({
          where: {
            tripId: bid.tripId,
            id: {
              not: bidId,
            },
          },
          data: {
            status: 'rejected',
          },
        });

        return updatedTrip;
      });

      this.logger.log(`Bid ${bidId} accepted for trip ${bid.tripId}`);

      return {
        message: 'Bid accepted successfully',
        trip: {
          id: result.id,
          status: result.status,
          finalFare: result.finalFare,
          driver: {
            firstName: bid.driver.user.firstName,
            lastName: bid.driver.user.lastName,
            phone: bid.driver.user.phone,
            rating: bid.driver.rating,
          },
          vehicle: {
            make: bid.vehicle.make,
            model: bid.vehicle.model,
            color: bid.vehicle.color,
            licensePlate: bid.vehicle.licensePlate,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Error accepting bid: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get driver's bid history
   */
  async getDriverBids(driverId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId: driverId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const bids = await this.prisma.bid.findMany({
      where: { driverId: driver.id },
      include: {
        trip: {
          include: {
            rider: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    return bids;
  }
}
