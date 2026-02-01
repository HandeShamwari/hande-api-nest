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
var TripsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/services/prisma.service");
let TripsService = TripsService_1 = class TripsService {
    prisma;
    logger = new common_1.Logger(TripsService_1.name);
    realtimeGateway;
    constructor(prisma) {
        this.prisma = prisma;
    }
    calculateFare(distanceKm) {
        const baseFare = 2.0;
        const perKmRate = 0.5;
        const calculatedFare = baseFare + distanceKm * perKmRate;
        return Math.max(calculatedFare, baseFare);
    }
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) *
                Math.cos(this.toRad(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }
    async createTrip(userId, dto) {
        try {
            const rider = await this.prisma.rider.findFirst({
                where: { userId },
            });
            if (!rider) {
                throw new common_1.BadRequestException('Rider profile not found');
            }
            const distance = this.calculateDistance(dto.startLatitude, dto.startLongitude, dto.endLatitude, dto.endLongitude);
            const estimatedFare = this.calculateFare(distance);
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
                    duration: 0,
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
        }
        catch (error) {
            this.logger.error(`Failed to create trip: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getTrip(tripId, userId) {
        return this.getTripById(tripId, userId);
    }
    async getTripById(tripId, userId) {
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
            throw new common_1.NotFoundException('Trip not found');
        }
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.ForbiddenException('User not found');
        }
        if (user.userType === 'rider') {
            const rider = await this.prisma.rider.findFirst({ where: { userId } });
            if (trip.riderId !== rider?.id) {
                throw new common_1.ForbiddenException('You do not have access to this trip');
            }
        }
        else if (user.userType === 'driver') {
            const driver = await this.prisma.driver.findFirst({ where: { userId } });
            const hasBid = trip.bids.some(bid => bid.driverId === driver?.id);
            if (trip.driverId !== driver?.id && !hasBid && trip.status !== 'pending') {
                throw new common_1.ForbiddenException('You do not have access to this trip');
            }
        }
        return trip;
    }
    async getNearbyTrips(userId, radius = 10) {
        try {
            const driver = await this.prisma.driver.findFirst({
                where: { userId },
            });
            if (!driver) {
                throw new common_1.BadRequestException('Driver profile not found');
            }
            if (driver.dailyFeeStatus !== 'paid') {
                throw new common_1.BadRequestException('Active subscription required to view trip requests');
            }
            if (!driver.currentLatitude || !driver.currentLongitude) {
                throw new common_1.BadRequestException('Please update your location to view nearby trips');
            }
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
            const nearbyTrips = allTrips
                .map((trip) => {
                const distance = this.calculateDistance(parseFloat(driver.currentLatitude.toString()), parseFloat(driver.currentLongitude.toString()), parseFloat(trip.startLatitude.toString()), parseFloat(trip.startLongitude.toString()));
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
        }
        catch (error) {
            this.logger.error(`Failed to get nearby trips: ${error.message}`, error.stack);
            throw error;
        }
    }
    async acceptTrip(tripId, userId) {
        try {
            const driver = await this.prisma.driver.findFirst({
                where: { userId },
                include: { vehicles: { where: { status: 'approved' }, take: 1 } },
            });
            if (!driver) {
                throw new common_1.BadRequestException('Driver profile not found');
            }
            if (driver.dailyFeeStatus !== 'paid') {
                throw new common_1.BadRequestException('Active subscription required');
            }
            if (!driver.vehicles || driver.vehicles.length === 0) {
                throw new common_1.BadRequestException('Please add and activate a vehicle first');
            }
            const trip = await this.prisma.trip.findUnique({
                where: { id: tripId },
            });
            if (!trip) {
                throw new common_1.NotFoundException('Trip not found');
            }
            if (trip.status !== 'pending') {
                throw new common_1.BadRequestException('Trip is no longer available');
            }
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
            if (this.realtimeGateway) {
                try {
                    await this.realtimeGateway.broadcastTripStatus(tripId, 'driver_assigned', {
                        driverId: driver.id,
                        driverName: `${updatedTrip.driver.user.firstName} ${updatedTrip.driver.user.lastName}`,
                        vehicle: driver.vehicles[0],
                    });
                    await this.realtimeGateway.notifyUser(updatedTrip.rider.userId, 'rider', {
                        type: 'trip_accepted',
                        title: 'Driver Assigned',
                        message: `${updatedTrip.driver.user.firstName} is on the way!`,
                        data: { tripId, driverId: driver.id },
                    });
                }
                catch (error) {
                    this.logger.warn(`Failed to broadcast trip acceptance: ${error.message}`);
                }
            }
            this.logger.log(`Trip ${tripId} accepted by driver ${driver.id}`);
            return updatedTrip;
        }
        catch (error) {
            this.logger.error(`Failed to accept trip: ${error.message}`, error.stack);
            throw error;
        }
    }
    async updateTripStatus(tripId, userId, dto) {
        const { status, reason } = dto;
        switch (status) {
            case 'in_progress':
                return this.startTrip(tripId, userId);
            case 'completed':
                return this.completeTrip(tripId, userId);
            case 'cancelled':
                return this.cancelTrip(tripId, userId, { reason, cancelledBy: 'driver' });
            default:
                throw new common_1.BadRequestException(`Invalid status: ${status}`);
        }
    }
    async startTrip(tripId, userId) {
        const driver = await this.prisma.driver.findFirst({
            where: { userId },
        });
        if (!driver) {
            throw new common_1.BadRequestException('Driver profile not found');
            if (this.realtimeGateway) {
                await this.realtimeGateway.broadcastTripStatus(tripId, 'in_progress', {
                    startedAt: updatedTrip.startedAt,
                });
            }
        }
        const trip = await this.prisma.trip.findUnique({
            where: { id: tripId },
        });
        if (!trip) {
            throw new common_1.NotFoundException('Trip not found');
        }
        if (trip.driverId !== driver.id) {
            throw new common_1.ForbiddenException('You are not assigned to this trip');
        }
        if (trip.status !== 'driver_assigned' && trip.status !== 'driver_arrived') {
            throw new common_1.BadRequestException('Trip cannot be started');
        }
        const updatedTrip = await this.prisma.trip.update({
            where: { id: tripId },
            data: {
                status: 'in_progress',
                startedAt: new Date(),
            },
        });
        this.logger.log(`Trip ${tripId} started by driver ${driver.id}`);
        return updatedTrip;
    }
    async completeTrip(tripId, userId) {
        const driver = await this.prisma.driver.findFirst({
            where: { userId },
        });
        if (!driver) {
            throw new common_1.BadRequestException('Driver profile not found');
        }
        const trip = await this.prisma.trip.findUnique({
            where: { id: tripId },
        });
        if (!trip) {
            throw new common_1.NotFoundException('Trip not found');
        }
        if (trip.driverId !== driver.id) {
            throw new common_1.ForbiddenException('You are not assigned to this trip');
        }
        if (trip.status !== 'in_progress') {
            throw new common_1.BadRequestException('Trip is not in progress');
        }
        if (this.realtimeGateway) {
            await this.realtimeGateway.broadcastTripStatus(tripId, 'completed', {
                completedAt: updatedTrip.completedAt,
                finalFare: updatedTrip.finalFare,
            });
            await this.realtimeGateway.notifyUser(updatedTrip.rider.userId, 'rider', {
                type: 'trip_completed',
                title: 'Trip Completed',
                message: 'Your trip has been completed. Please rate your driver.',
                data: { tripId, finalFare: updatedTrip.finalFare },
            });
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
        return updatedTrip;
    }
    async cancelTrip(tripId, userId, cancelTripDto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.ForbiddenException('User not found');
        }
        const trip = await this.prisma.trip.findUnique({
            where: { id: tripId },
            include: {
                rider: true,
                driver: true,
            },
        });
        if (!trip) {
            throw new common_1.NotFoundException('Trip not found');
        }
        if (user.userType === 'rider') {
            const rider = await this.prisma.rider.findFirst({ where: { userId } });
            if (trip.riderId !== rider?.id) {
                throw new common_1.ForbiddenException('You cannot cancel this trip');
            }
            if (this.realtimeGateway) {
                await this.realtimeGateway.broadcastTripStatus(tripId, 'cancelled', {
                    cancelledBy: cancelTripDto.cancelledBy || user.userType,
                    reason: cancelTripDto.reason,
                });
            }
        }
        else if (user.userType === 'driver') {
            const driver = await this.prisma.driver.findFirst({ where: { userId } });
            if (trip.driverId !== driver?.id) {
                throw new common_1.ForbiddenException('You cannot cancel this trip');
            }
        }
        if (trip.status === 'completed' || trip.status === 'cancelled') {
            throw new common_1.BadRequestException('Trip cannot be cancelled');
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
    async getRiderTrips(userId, status) {
        const rider = await this.prisma.rider.findFirst({
            where: { userId },
        });
        if (!rider) {
            throw new common_1.BadRequestException('Rider profile not found');
        }
        const trips = await this.prisma.trip.findMany({
            where: {
                riderId: rider.id,
                ...(status && { status: status }),
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
    async getDriverTrips(userId, status) {
        const driver = await this.prisma.driver.findFirst({
            where: { userId },
        });
        if (!driver) {
            throw new common_1.BadRequestException('Driver profile not found');
        }
        const trips = await this.prisma.trip.findMany({
            where: {
                driverId: driver.id,
                ...(status && { status: status }),
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
    setRealtimeGateway(gateway) {
        this.realtimeGateway = gateway;
    }
};
exports.TripsService = TripsService;
exports.TripsService = TripsService = TripsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TripsService);
//# sourceMappingURL=trips.service.js.map