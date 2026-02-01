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
      const driver = await this.prisma.driver.findFirst({
        where: { userId },
        include: { vehicles: { where: { status: 'approved' }, take: 1 } },
      });

      if (!driver) {
        throw new BadRequestException('Driver profile not found');
      }

      if (driver.dailyFeeStatus !== 'paid') {
        throw new BadRequestException('Active subscription required to place bids');
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
        throw new BadRequestException('Trip is no longer accepting bids');
      }

      // Check if driver already has a bid
      const existingBid = await this.prisma.bid.findFirst({
        where: {
          tripId,
          driverId: driver.id,
        },
      });

      if (existingBid) {
        throw new BadRequestException('You have already placed a bid on this trip');
      }

      const bid = await this.prisma.bid.create({
        data: {
          tripId,
          driverId: driver.id,
          amount: createBidDto.amount.toFixed(2),
          message: createBidDto.message,
          estimatedArrivalTime: createBidDto.estimatedArrivalTime,
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
              vehicles: { where: { status: 'approved' }, take: 1 },
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
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    // Verify user is the rider for this trip
    const rider = await this.prisma.rider.findFirst({
      where: { userId },
    });

    if (!rider || trip.riderId !== rider.id) {
      throw new BadRequestException('You can only view bids for your own trips');
    }

    const bids = await this.prisma.bid.findMany({
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
            vehicles: { where: { status: 'approved' }, take: 1 },
          },
        },
      },
      orderBy: {
        amount: 'asc',
      },
    });

    return bids.map((bid) => ({
      id: bid.id,
      amount: parseFloat(bid.amount.toString()),
      message: bid.message,
      estimatedArrivalTime: bid.estimatedArrivalTime,
      status: bid.status,
      createdAt: bid.createdAt,
      driver: {
        id: bid.driver.id,
        user: bid.driver.user,
        rating: parseFloat(bid.driver.rating.toString()) || 0,
        totalTrips: bid.driver.totalTrips || 0,
        vehicle: bid.driver.vehicles[0] || null,
      },
    }));
  }

  /**
   * Rider accepts a bid
   */
  async acceptBid(bidId: string, userId: string) {
    try {
      const rider = await this.prisma.rider.findFirst({
        where: { userId },
      });

      if (!rider) {
        throw new BadRequestException('Rider profile not found');
      }

      const bid = await this.prisma.bid.findUnique({
        where: { id: bidId },
        include: {
          trip: true,
          driver: {
            include: {
              vehicles: { where: { status: 'approved' }, take: 1 },
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
        const updatedTrip = await tx.trip.update({
          where: { id: bid.tripId },
          data: {
            driverId: bid.driverId,
            vehicleId: bid.driver.vehicles[0]?.id || null,
            finalFare: bid.amount,
            status: 'driver_assigned',
            driverAssignedAt: new Date(),
          },
        });

        // Update accepted bid
        await tx.bid.update({
          where: { id: bidId },
          data: { status: 'accepted' },
        });

        // Reject other bids
        await tx.bid.updateMany({
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
      const trip = await this.prisma.trip.findUnique({
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
              vehicles: { where: { status: 'approved' }, take: 1 },
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
    const driver = await this.prisma.driver.findFirst({
      where: { userId },
    });

    if (!driver) {
      throw new BadRequestException('Driver profile not found');
    }

    const bids = await this.prisma.bid.findMany({
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
