import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { CreateBidDto } from '../dto/create-bid.dto';

@Injectable()
export class BidsService {
  private readonly logger = new Logger(BidsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Driver places bid on trip
   */
  async createBid(tripId: string, userId: string, createBidDto: CreateBidDto) {
    try {
      const driver = await this.prisma.tableDriver.findFirst({
        where: { userId },
        include: { activeVehicle: true },
      });

      if (!driver) {
        throw new BadRequestException('Driver profile not found');
      }

      if (driver.subscriptionStatus !== 'active') {
        throw new BadRequestException('Active subscription required to place bids');
      }

      if (!driver.activeVehicle) {
        throw new BadRequestException('Please activate a vehicle first');
      }

      const trip = await this.prisma.tableTrip.findUnique({
        where: { id: tripId },
      });

      if (!trip) {
        throw new NotFoundException('Trip not found');
      }

      if (trip.status !== 'pending') {
        throw new BadRequestException('Trip is no longer accepting bids');
      }

      // Check if driver already has a bid
      const existingBid = await this.prisma.tableBid.findFirst({
        where: {
          tripId,
          driverId: driver.id,
        },
      });

      if (existingBid) {
        throw new BadRequestException('You have already placed a bid on this trip');
      }

      const bid = await this.prisma.tableBid.create({
        data: {
          tripId,
          driverId: driver.id,
          proposedFare: createBidDto.proposedFare.toFixed(2),
          message: createBidDto.message,
          estimatedArrivalMinutes: createBidDto.estimatedArrivalMinutes,
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
              activeVehicle: true,
            },
          },
        },
      });

      this.logger.log(`Bid placed on trip ${tripId} by driver ${driver.id}`);

      return bid;
    } catch (error) {
      this.logger.error(`Failed to create bid: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all bids for a trip
   */
  async getTripBids(tripId: string, userId: string) {
    const trip = await this.prisma.tableTrip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    // Verify user is the rider for this trip
    const rider = await this.prisma.tableRider.findFirst({
      where: { userId },
    });

    if (!rider || trip.riderId !== rider.id) {
      throw new BadRequestException('You can only view bids for your own trips');
    }

    const bids = await this.prisma.tableBid.findMany({
      where: { tripId },
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
            activeVehicle: true,
          },
        },
      },
      orderBy: {
        proposedFare: 'asc',
      },
    });

    return bids.map((bid) => ({
      id: bid.id,
      proposedFare: parseFloat(bid.proposedFare),
      message: bid.message,
      estimatedArrivalMinutes: bid.estimatedArrivalMinutes,
      status: bid.status,
      createdAt: bid.createdAt,
      driver: {
        id: bid.driver.id,
        user: bid.driver.user,
        rating: bid.driver.rating || 0,
        totalTrips: bid.driver.totalTrips || 0,
        vehicle: bid.driver.activeVehicle,
      },
    }));
  }

  /**
   * Rider accepts a bid
   */
  async acceptBid(bidId: string, userId: string) {
    try {
      const rider = await this.prisma.tableRider.findFirst({
        where: { userId },
      });

      if (!rider) {
        throw new BadRequestException('Rider profile not found');
      }

      const bid = await this.prisma.tableBid.findUnique({
        where: { id: bidId },
        include: {
          trip: true,
          driver: {
            include: {
              activeVehicle: true,
            },
          },
        },
      });

      if (!bid) {
        throw new NotFoundException('Bid not found');
      }

      if (bid.trip.riderId !== rider.id) {
        throw new BadRequestException('You can only accept bids for your own trips');
      }

      if (bid.trip.status !== 'pending') {
        throw new BadRequestException('Trip is no longer accepting bids');
      }

      if (bid.status !== 'pending') {
        throw new BadRequestException('This bid is no longer available');
      }

      // Update trip and bid in transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Update trip
        const updatedTrip = await tx.tableTrip.update({
          where: { id: bid.tripId },
          data: {
            driverId: bid.driverId,
            vehicleId: bid.driver.activeVehicleId,
            finalFare: bid.proposedFare,
            status: 'accepted',
            acceptedAt: new Date(),
          },
        });

        // Update accepted bid
        await tx.tableBid.update({
          where: { id: bidId },
          data: { status: 'accepted' },
        });

        // Reject other bids
        await tx.tableBid.updateMany({
          where: {
            tripId: bid.tripId,
            id: { not: bidId },
            status: 'pending',
          },
          data: { status: 'rejected' },
        });

        return updatedTrip;
      });

      this.logger.log(`Bid ${bidId} accepted for trip ${bid.tripId}`);

      // Return updated trip with driver details
      const trip = await this.prisma.tableTrip.findUnique({
        where: { id: bid.tripId },
        include: {
          rider: {
            include: {
              user: true,
            },
          },
          driver: {
            include: {
              user: true,
              activeVehicle: true,
            },
          },
        },
      });

      return trip;
    } catch (error) {
      this.logger.error(`Failed to accept bid: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get driver's bids
   */
  async getDriverBids(userId: string, status?: string) {
    const driver = await this.prisma.tableDriver.findFirst({
      where: { userId },
    });

    if (!driver) {
      throw new BadRequestException('Driver profile not found');
    }

    const bids = await this.prisma.tableBid.findMany({
      where: {
        driverId: driver.id,
        ...(status && { status: status as any }),
      },
      include: {
        trip: {
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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    return bids;
  }
}
