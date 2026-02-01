"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehiclesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/services/prisma.service");
let VehiclesService = class VehiclesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, dto) {
        const driver = await this.prisma.driver.findUnique({
            where: { userId },
        });
        if (!driver) {
            throw new common_1.NotFoundException('Driver profile not found');
        }
        const existing = await this.prisma.driverVehicle.findUnique({
            where: { licensePlate: dto.licensePlate },
        });
        if (existing) {
            throw new common_1.BadRequestException('Vehicle with this license plate already exists');
        }
        const vehicle = await this.prisma.driverVehicle.create({
            data: {
                driverId: driver.id,
                make: dto.make,
                model: dto.model,
                year: dto.year,
                licensePlate: dto.licensePlate,
                color: dto.color,
                type: dto.type || 'sedan',
                capacity: dto.capacity || dto.seats || 4,
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
    async findAll(userId) {
        const driver = await this.prisma.driver.findUnique({
            where: { userId },
            include: {
                vehicles: true,
            },
        });
        if (!driver) {
            throw new common_1.NotFoundException('Driver profile not found');
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
    async findOne(userId, vehicleId) {
        const driver = await this.prisma.driver.findUnique({
            where: { userId },
        });
        if (!driver) {
            throw new common_1.NotFoundException('Driver profile not found');
        }
        const vehicle = await this.prisma.driverVehicle.findFirst({
            where: {
                id: vehicleId,
                driverId: driver.id,
            },
        });
        if (!vehicle) {
            throw new common_1.NotFoundException('Vehicle not found');
        }
        return vehicle;
    }
    async update(userId, vehicleId, dto) {
        const driver = await this.prisma.driver.findUnique({
            where: { userId },
        });
        if (!driver) {
            throw new common_1.NotFoundException('Driver profile not found');
        }
        const vehicle = await this.prisma.driverVehicle.findFirst({
            where: {
                id: vehicleId,
                driverId: driver.id,
            },
        });
        if (!vehicle) {
            throw new common_1.NotFoundException('Vehicle not found');
        }
        if (dto.licensePlate && dto.licensePlate !== vehicle.licensePlate) {
            const existing = await this.prisma.driverVehicle.findUnique({
                where: { licensePlate: dto.licensePlate },
            });
            if (existing) {
                throw new common_1.BadRequestException('Vehicle with this license plate already exists');
            }
        }
        const updated = await this.prisma.driverVehicle.update({
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
    async remove(userId, vehicleId) {
        const driver = await this.prisma.driver.findUnique({
            where: { userId },
        });
        if (!driver) {
            throw new common_1.NotFoundException('Driver profile not found');
        }
        const vehicle = await this.prisma.driverVehicle.findFirst({
            where: {
                id: vehicleId,
                driverId: driver.id,
            },
        });
        if (!vehicle) {
            throw new common_1.NotFoundException('Vehicle not found');
        }
        await this.prisma.driverVehicle.delete({
            where: { id: vehicleId },
        });
        return {
            message: 'Vehicle deleted successfully',
        };
    }
    async setActive(userId, vehicleId) {
        const driver = await this.prisma.driver.findUnique({
            where: { userId },
        });
        if (!driver) {
            throw new common_1.NotFoundException('Driver profile not found');
        }
        const vehicle = await this.prisma.driverVehicle.findFirst({
            where: {
                id: vehicleId,
                driverId: driver.id,
            },
        });
        if (!vehicle) {
            throw new common_1.NotFoundException('Vehicle not found');
        }
        if (vehicle.status !== 'approved') {
            throw new common_1.BadRequestException('Only approved vehicles can be set as active');
        }
        await this.prisma.driverVehicle.updateMany({
            where: {
                driverId: driver.id,
                isActive: true,
            },
            data: {
                isActive: false,
            },
        });
        await this.prisma.driverVehicle.update({
            where: { id: vehicleId },
            data: {
                isActive: true,
            },
        });
        return {
            message: 'Vehicle set as active',
        };
    }
};
exports.VehiclesService = VehiclesService;
exports.VehiclesService = VehiclesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VehiclesService);
//# sourceMappingURL=vehicles.service.js.map