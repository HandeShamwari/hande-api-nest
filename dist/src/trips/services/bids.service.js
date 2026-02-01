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
var BidsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BidsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/services/prisma.service");
let BidsService = BidsService_1 = class BidsService {
    prisma;
    logger = new common_1.Logger(BidsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createBid(tripId, userId, createBidDto) {
        try {
            const driver = await this.prisma.driver.findFirst({
                where: { userId },
                include: { vehicles: { where: { status: 'approved' }, take: 1 } },
            });
            if (!driver) {
                throw new common_1.BadRequestException('Driver profile not found');
            }
            if (driver.dailyFeeStatus !== 'paid') {
                throw new common_1.BadRequestException('Active subscription required to place bids');
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
                throw new common_1.BadRequestException('Trip is no longer accepting bids');
            }
            const existingBid = await this.prisma.bid.findFirst({
                where: {
                    tripId,
                    driverId: driver.id,
                },
            });
            if (existingBid) {
                throw new common_1.BadRequestException('You have already placed a bid on this trip');
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
        }
        catch (error) {
            this.logger.error(`Failed to create bid: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getTripBids(tripId, userId) {
        const trip = await this.prisma.trip.findUnique({
            where: { id: tripId },
        });
        if (!trip) {
            throw new common_1.NotFoundException('Trip not found');
        }
        const rider = await this.prisma.rider.findFirst({
            where: { userId },
        });
        if (!rider || trip.riderId !== rider.id) {
            throw new common_1.BadRequestException('You can only view bids for your own trips');
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
    async acceptBid(bidId, userId) {
        try {
            const rider = await this.prisma.rider.findFirst({
                where: { userId },
            });
            if (!rider) {
                throw new common_1.BadRequestException('Rider profile not found');
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
                throw new common_1.NotFoundException('Bid not found');
            }
            if (bid.trip.riderId !== rider.id) {
                throw new common_1.BadRequestException('You can only accept bids for your own trips');
            }
            if (bid.trip.status !== 'pending') {
                throw new common_1.BadRequestException('Trip is no longer accepting bids');
            }
            if (bid.status !== 'pending') {
                throw new common_1.BadRequestException('This bid is no longer available');
            }
            const result = await this.prisma.$transaction(async (tx) => {
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
                await tx.bid.update({
                    where: { id: bidId },
                    data: { status: 'accepted' },
                });
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
        }
        catch (error) {
            this.logger.error(`Failed to accept bid: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getDriverBids(userId, status) {
        const driver = await this.prisma.driver.findFirst({
            where: { userId },
        });
        if (!driver) {
            throw new common_1.BadRequestException('Driver profile not found');
        }
        const bids = await this.prisma.bid.findMany({
            where: {
                driverId: driver.id,
                ...(status && { status: status }),
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
};
exports.BidsService = BidsService;
exports.BidsService = BidsService = BidsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BidsService);
//# sourceMappingURL=bids.service.js.map