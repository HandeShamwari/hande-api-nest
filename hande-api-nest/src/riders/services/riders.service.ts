import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { UpdateRiderProfileDto, RiderStatsResponseDto } from '../dto/rider.dto';

@Injectable()
export class RidersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get rider profile
   */
  async getProfile(userId: string) {
    const rider = await this.prisma.rider.findUnique({
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
        savedPlaces: true,
      },
    });

    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    return {
      id: rider.id,
      user: rider.user,
      emergencyContactName: rider.emergencyContactName,
      emergencyContactPhone: rider.emergencyContactPhone,
      rating: rider.rating,
      totalTrips: rider.totalTrips,
      homeAddress: rider.homeAddress,
      homeLocation: rider.homeLatitude && rider.homeLongitude ? {
        latitude: rider.homeLatitude,
        longitude: rider.homeLongitude,
      } : null,
      savedPlaces: rider.savedPlaces,
    };
  }

  /**
   * Update rider profile
   */
  async updateProfile(userId: string, dto: UpdateRiderProfileDto) {
    const rider = await this.prisma.rider.findUnique({
      where: { userId },
    });

    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    const updated = await this.prisma.rider.update({
      where: { id: rider.id },
      data: {
        emergencyContactName: dto.emergencyContactName,
        emergencyContactPhone: dto.emergencyContactPhone,
        profilePicture: dto.profilePicture,
        homeAddress: dto.homeAddress,
        homeLatitude: dto.homeLatitude,
        homeLongitude: dto.homeLongitude,
      },
    });

    return {
      message: 'Profile updated successfully',
      rider: {
        id: updated.id,
        emergencyContactName: updated.emergencyContactName,
        emergencyContactPhone: updated.emergencyContactPhone,
        homeAddress: updated.homeAddress,
      },
    };
  }

  /**
   * Get rider statistics
   */
  async getStats(userId: string): Promise<RiderStatsResponseDto> {
    const rider = await this.prisma.rider.findUnique({
      where: { userId },
      include: {
        trips: {
          where: {
            status: { in: ['completed', 'cancelled'] },
          },
        },
      },
    });

    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    const completedTrips = rider.trips.filter(t => t.status === 'completed');
    const cancelledTrips = rider.trips.filter(t => t.status === 'cancelled');
    const totalSpent = completedTrips.reduce((sum, trip) => sum + (trip.finalFare || 0), 0);

    // Get favorite destinations (top 5)
    const destinationCounts = completedTrips.reduce((acc, trip) => {
      const dest = trip.destinationAddress || 'Unknown';
      acc[dest] = (acc[dest] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const favoriteDestinations = Object.entries(destinationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([address, count]) => ({ address, count }));

    return {
      totalTrips: rider.trips.length,
      completedTrips: completedTrips.length,
      cancelledTrips: cancelledTrips.length,
      totalSpent,
      averageRating: rider.rating || 0,
      favoriteDestinations,
    };
  }

  /**
   * Get recent trips
   */
  async getRecentTrips(userId: string, limit = 10) {
    const rider = await this.prisma.rider.findUnique({
      where: { userId },
    });

    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    const trips = await this.prisma.trip.findMany({
      where: { riderId: rider.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        driver: {
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
    });

    return trips.map(trip => ({
      id: trip.id,
      status: trip.status,
      pickupAddress: trip.pickupAddress,
      destinationAddress: trip.destinationAddress,
      fare: trip.finalFare || trip.estimatedFare,
      createdAt: trip.createdAt,
      completedAt: trip.completedAt,
      driver: trip.driver ? {
        name: `${trip.driver.user.firstName} ${trip.driver.user.lastName}`,
        rating: trip.driver.rating,
      } : null,
    }));
  }
}
