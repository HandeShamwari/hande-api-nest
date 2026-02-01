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
exports.RidersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/services/prisma.service");
let RidersService = class RidersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfile(userId) {
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
            throw new common_1.NotFoundException('Rider profile not found');
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
    async updateProfile(userId, dto) {
        const rider = await this.prisma.rider.findUnique({
            where: { userId },
        });
        if (!rider) {
            throw new common_1.NotFoundException('Rider profile not found');
        }
        const updated = await this.prisma.rider.update({
            where: { id: rider.id },
            data: {},
        });
        return {
            message: 'Profile updated successfully',
            rider: {
                id: updated.id,
            },
        };
    }
    async getStats(userId) {
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
            throw new common_1.NotFoundException('Rider profile not found');
        }
        const completedTrips = rider.trips.filter(t => t.status === 'completed');
        const cancelledTrips = rider.trips.filter(t => t.status === 'cancelled');
        const totalSpent = completedTrips.reduce((sum, trip) => sum + (trip.finalFare ? Number(trip.finalFare) : 0), 0);
        const destinationCounts = completedTrips.reduce((acc, trip) => {
            const dest = trip.endAddress || 'Unknown';
            acc[dest] = (acc[dest] || 0) + 1;
            return acc;
        }, {});
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
    async getRecentTrips(userId, limit = 10) {
        const rider = await this.prisma.rider.findUnique({
            where: { userId },
        });
        if (!rider) {
            throw new common_1.NotFoundException('Rider profile not found');
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
};
exports.RidersService = RidersService;
exports.RidersService = RidersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RidersService);
//# sourceMappingURL=riders.service.js.map