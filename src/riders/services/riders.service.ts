import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { 
  UpdateRiderProfileDto, 
  RiderStatsResponseDto,
  CreateSavedLocationDto,
  UpdateSavedLocationDto,
  CreateEmergencyContactDto,
  UpdateEmergencyContactDto,
  UpdateRiderLocationDto,
} from '../dto/rider.dto';

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
        emergencyContacts: true,
        favoriteLocations: true,
      },
    });

    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    return {
      id: rider.id,
      user: rider.user,
      emergencyContacts: rider.emergencyContacts,
      rating: Number(rider.averageRating),
      totalTrips: rider.totalTrips,
      favoriteLocations: rider.favoriteLocations,
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
        // Update basic fields only - emergency contacts managed separately
      },
    });

    return {
      message: 'Profile updated successfully',
      rider: {
        id: updated.id,
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
    const totalSpent = completedTrips.reduce((sum, trip) => sum + (trip.finalFare ? Number(trip.finalFare) : 0), 0);

    // Get favorite destinations (top 5)
    const destinationCounts = completedTrips.reduce((acc, trip) => {
      const dest = trip.endAddress || 'Unknown';
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
      averageRating: Number(rider.averageRating) || 0,
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
      startAddress: trip.startAddress,
      endAddress: trip.endAddress,
      fare: trip.finalFare ? Number(trip.finalFare) : Number(trip.estimatedFare),
      createdAt: trip.createdAt,
      completedAt: trip.completedAt,
      driver: trip.driver ? {
        name: `${trip.driver.user.firstName} ${trip.driver.user.lastName}`,
        rating: Number(trip.driver.averageRating),
      } : null,
    }));
  }

  // ============================================================================
  // SAVED LOCATIONS
  // ============================================================================

  /**
   * Get all saved locations
   */
  async getSavedLocations(userId: string) {
    const rider = await this.prisma.rider.findUnique({
      where: { userId },
    });

    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    return this.prisma.favoriteLocation.findMany({
      where: { riderId: rider.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create saved location
   */
  async createSavedLocation(userId: string, dto: CreateSavedLocationDto) {
    const rider = await this.prisma.rider.findUnique({
      where: { userId },
    });

    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    // Limit to 10 saved locations
    const count = await this.prisma.favoriteLocation.count({
      where: { riderId: rider.id },
    });

    if (count >= 10) {
      throw new BadRequestException('Maximum 10 saved locations allowed');
    }

    return this.prisma.favoriteLocation.create({
      data: {
        riderId: rider.id,
        name: dto.name,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        type: dto.type || 'other',
      },
    });
  }

  /**
   * Update saved location
   */
  async updateSavedLocation(userId: string, locationId: string, dto: UpdateSavedLocationDto) {
    const rider = await this.prisma.rider.findUnique({
      where: { userId },
    });

    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    const location = await this.prisma.favoriteLocation.findFirst({
      where: { id: locationId, riderId: rider.id },
    });

    if (!location) {
      throw new NotFoundException('Saved location not found');
    }

    return this.prisma.favoriteLocation.update({
      where: { id: locationId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.address && { address: dto.address }),
        ...(dto.latitude && { latitude: dto.latitude }),
        ...(dto.longitude && { longitude: dto.longitude }),
        ...(dto.type && { type: dto.type }),
      },
    });
  }

  /**
   * Delete saved location
   */
  async deleteSavedLocation(userId: string, locationId: string) {
    const rider = await this.prisma.rider.findUnique({
      where: { userId },
    });

    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    const location = await this.prisma.favoriteLocation.findFirst({
      where: { id: locationId, riderId: rider.id },
    });

    if (!location) {
      throw new NotFoundException('Saved location not found');
    }

    await this.prisma.favoriteLocation.delete({
      where: { id: locationId },
    });

    return { success: true, message: 'Location deleted' };
  }

  // ============================================================================
  // EMERGENCY CONTACTS
  // ============================================================================

  /**
   * Get all emergency contacts
   */
  async getEmergencyContacts(userId: string) {
    const rider = await this.prisma.rider.findUnique({
      where: { userId },
    });

    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    return this.prisma.emergencyContact.findMany({
      where: { riderId: rider.id },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Create emergency contact
   */
  async createEmergencyContact(userId: string, dto: CreateEmergencyContactDto) {
    const rider = await this.prisma.rider.findUnique({
      where: { userId },
    });

    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    // Limit to 5 emergency contacts
    const count = await this.prisma.emergencyContact.count({
      where: { riderId: rider.id },
    });

    if (count >= 5) {
      throw new BadRequestException('Maximum 5 emergency contacts allowed');
    }

    // If setting as primary, unset other primaries
    if (dto.isPrimary) {
      await this.prisma.emergencyContact.updateMany({
        where: { riderId: rider.id },
        data: { isPrimary: false },
      });
    }

    // First contact is automatically primary
    const isPrimary = count === 0 ? true : dto.isPrimary || false;

    return this.prisma.emergencyContact.create({
      data: {
        riderId: rider.id,
        name: dto.name,
        phone: dto.phone,
        relationship: dto.relationship,
        isPrimary,
      },
    });
  }

  /**
   * Update emergency contact
   */
  async updateEmergencyContact(userId: string, contactId: string, dto: UpdateEmergencyContactDto) {
    const rider = await this.prisma.rider.findUnique({
      where: { userId },
    });

    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    const contact = await this.prisma.emergencyContact.findFirst({
      where: { id: contactId, riderId: rider.id },
    });

    if (!contact) {
      throw new NotFoundException('Emergency contact not found');
    }

    // If setting as primary, unset other primaries
    if (dto.isPrimary) {
      await this.prisma.emergencyContact.updateMany({
        where: { riderId: rider.id, id: { not: contactId } },
        data: { isPrimary: false },
      });
    }

    return this.prisma.emergencyContact.update({
      where: { id: contactId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.phone && { phone: dto.phone }),
        ...(dto.relationship !== undefined && { relationship: dto.relationship }),
        ...(dto.isPrimary !== undefined && { isPrimary: dto.isPrimary }),
      },
    });
  }

  /**
   * Delete emergency contact
   */
  async deleteEmergencyContact(userId: string, contactId: string) {
    const rider = await this.prisma.rider.findUnique({
      where: { userId },
    });

    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    const contact = await this.prisma.emergencyContact.findFirst({
      where: { id: contactId, riderId: rider.id },
    });

    if (!contact) {
      throw new NotFoundException('Emergency contact not found');
    }

    await this.prisma.emergencyContact.delete({
      where: { id: contactId },
    });

    // If deleted contact was primary, set another as primary
    if (contact.isPrimary) {
      const remaining = await this.prisma.emergencyContact.findFirst({
        where: { riderId: rider.id },
        orderBy: { createdAt: 'asc' },
      });

      if (remaining) {
        await this.prisma.emergencyContact.update({
          where: { id: remaining.id },
          data: { isPrimary: true },
        });
      }
    }

    return { success: true, message: 'Contact deleted' };
  }

  /**
   * Update rider location
   */
  async updateLocation(userId: string, dto: UpdateRiderLocationDto) {
    const rider = await this.prisma.rider.findUnique({
      where: { userId },
    });

    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    await this.prisma.rider.update({
      where: { id: rider.id },
      data: {
        currentLatitude: dto.latitude,
        currentLongitude: dto.longitude,
        lastLocationUpdate: new Date(),
      },
    });

    return { success: true };
  }
}
