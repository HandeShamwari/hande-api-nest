import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from '../dto/vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Add a new vehicle for a driver
   */
  async create(userId: string, dto: CreateVehicleDto) {
    // Get driver profile
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    // Check if license plate already exists
    const existing = await this.prisma.vehicle.findUnique({
      where: { licensePlate: dto.licensePlate },
    });

    if (existing) {
      throw new BadRequestException('Vehicle with this license plate already exists');
    }

    // Create vehicle
    const vehicle = await this.prisma.vehicle.create({
      data: {
        driverId: driver.id,
        make: dto.make,
        model: dto.model,
        year: dto.year,
        licensePlate: dto.licensePlate,
        color: dto.color,
        type: dto.type,
        seats: dto.seats || 4,
        photo: dto.photo,
        status: 'pending_approval',
      },
    });

    return {
      message: 'Vehicle added successfully. Awaiting admin approval.',
      vehicle: {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        licensePlate: vehicle.licensePlate,
        status: vehicle.status,
      },
    };
  }

  /**
   * Get all vehicles for a driver
   */
  async findAll(userId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
      include: {
        vehicles: true,
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    return driver.vehicles.map(vehicle => ({
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      licensePlate: vehicle.licensePlate,
      color: vehicle.color,
      type: vehicle.type,
      seats: vehicle.seats,
      photo: vehicle.photo,
      status: vehicle.status,
      isActive: vehicle.isActive,
    }));
  }

  /**
   * Get a specific vehicle
   */
  async findOne(userId: string, vehicleId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        driverId: driver.id,
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return vehicle;
  }

  /**
   * Update vehicle details
   */
  async update(userId: string, vehicleId: string, dto: UpdateVehicleDto) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        driverId: driver.id,
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // If updating license plate, check for duplicates
    if (dto.licensePlate && dto.licensePlate !== vehicle.licensePlate) {
      const existing = await this.prisma.vehicle.findUnique({
        where: { licensePlate: dto.licensePlate },
      });

      if (existing) {
        throw new BadRequestException('Vehicle with this license plate already exists');
      }
    }

    const updated = await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        color: dto.color,
        photo: dto.photo,
        licensePlate: dto.licensePlate,
      },
    });

    return {
      message: 'Vehicle updated successfully',
      vehicle: updated,
    };
  }

  /**
   * Delete a vehicle
   */
  async remove(userId: string, vehicleId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        driverId: driver.id,
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    await this.prisma.vehicle.delete({
      where: { id: vehicleId },
    });

    return {
      message: 'Vehicle deleted successfully',
    };
  }

  /**
   * Set active vehicle for trips
   */
  async setActive(userId: string, vehicleId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        driverId: driver.id,
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (vehicle.status !== 'approved') {
      throw new BadRequestException('Only approved vehicles can be set as active');
    }

    // Deactivate all other vehicles
    await this.prisma.vehicle.updateMany({
      where: {
        driverId: driver.id,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Activate this vehicle
    await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        isActive: true,
      },
    });

    return {
      message: 'Vehicle set as active',
    };
  }
}
