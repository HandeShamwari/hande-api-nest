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
var DriversService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriversService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/services/prisma.service");
const supabase_service_1 = require("../../shared/services/supabase.service");
const config_1 = require("@nestjs/config");
let DriversService = DriversService_1 = class DriversService {
    prisma;
    config;
    supabase;
    logger = new common_1.Logger(DriversService_1.name);
    dailyFeeAmount;
    graceHours;
    realtimeGateway;
    constructor(prisma, config, supabase) {
        this.prisma = prisma;
        this.config = config;
        this.supabase = supabase;
        this.dailyFeeAmount = parseFloat(this.config.get('DAILY_FEE_AMOUNT', '1.00'));
        this.graceHours = parseInt(this.config.get('DAILY_FEE_GRACE_HOURS', '6'));
    }
    setRealtimeGateway(gateway) {
        this.realtimeGateway = gateway;
    }
    async subscribe(userId, dto) {
        const driver = await this.prisma.driver.findUnique({
            where: { userId },
            include: { user: true },
        });
        if (!driver) {
            throw new common_1.NotFoundException('Driver profile not found');
        }
        const now = new Date();
        const activeSubscription = await this.prisma.dailyFee.findFirst({
            where: {
                driverId: driver.id,
                expiresAt: { gt: now },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (activeSubscription) {
            throw new common_1.BadRequestException('You already have an active subscription');
        }
        const amount = dto.amount || this.dailyFeeAmount;
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const subscription = await this.prisma.dailyFee.create({
            data: {
                driverId: driver.id,
                amount,
                feeDate: now,
                paidAt: now,
                expiresAt,
                status: 'paid',
            },
        });
        await this.prisma.driver.update({
            where: { id: driver.id },
            data: {
                status: 'available',
                subscriptionExpiresAt: expiresAt,
            },
        });
        return {
            message: 'Subscription successful',
            subscription: {
                id: subscription.id,
                amount: subscription.amount,
                expiresAt: subscription.expiresAt,
                status: subscription.status,
            },
        };
    }
    async getSubscriptionStatus(userId) {
        const driver = await this.prisma.driver.findUnique({
            where: { userId },
            include: {
                dailyFees: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
        });
        if (!driver) {
            throw new common_1.NotFoundException('Driver profile not found');
        }
        const now = new Date();
        const isActive = driver.subscriptionExpiresAt && driver.subscriptionExpiresAt > now;
        let subscriptionStatus = 'inactive';
        if (isActive) {
            subscriptionStatus = 'active';
        }
        else if (driver.subscriptionExpiresAt) {
            const graceEndTime = new Date(driver.subscriptionExpiresAt.getTime() + this.graceHours * 60 * 60 * 1000);
            if (now < graceEndTime) {
                subscriptionStatus = 'grace_period';
            }
        }
        return {
            driverId: driver.id,
            status: subscriptionStatus,
            expiresAt: driver.subscriptionExpiresAt,
            canAcceptRides: subscriptionStatus === 'active' || subscriptionStatus === 'grace_period',
            recentPayments: driver.dailyFees.map(fee => ({
                id: fee.id,
                amount: fee.amount,
                paidAt: fee.paidAt,
                expiresAt: fee.expiresAt,
                status: fee.status,
            })),
        };
    }
    async updateProfile(userId, dto) {
        const driver = await this.prisma.driver.findUnique({
            where: { userId },
            include: { user: true },
        });
        if (!driver) {
            throw new common_1.NotFoundException('Driver profile not found');
        }
        const updated = await this.prisma.driver.update({
            where: { id: driver.id },
            data: {
                licenseNumber: dto.licenseNumber,
                licenseExpiryDate: dto.licenseExpiry ? new Date(dto.licenseExpiry) : undefined,
            },
        });
        return {
            message: 'Profile updated successfully',
            driver: {
                id: updated.id,
                licenseNumber: updated.licenseNumber,
                licenseExpiryDate: updated.licenseExpiryDate,
                status: updated.status,
            },
        };
    }
    async updateLocation(userId, dto) {
        const driver = await this.prisma.driver.findUnique({
            where: { userId },
        });
        if (!driver) {
            throw new common_1.NotFoundException('Driver profile not found');
        }
        await this.prisma.driverLocation.create({
            data: {
                driverId: driver.id,
                latitude: dto.latitude,
                longitude: dto.longitude,
                heading: dto.heading,
                speed: dto.speed,
                recordedAt: new Date(),
            },
        });
        const updatedDriver = await this.prisma.driver.update({
            where: { id: driver.id },
            data: {
                currentLatitude: dto.latitude,
                currentLongitude: dto.longitude,
                lastLocationUpdate: new Date(),
            },
            include: {
                trips: {
                    where: {
                        status: { in: ['accepted', 'ongoing'] },
                    },
                },
            },
        });
        const locationData = {
            driverId: driver.id,
            latitude: dto.latitude,
            longitude: dto.longitude,
            heading: dto.heading,
            speed: dto.speed,
            timestamp: new Date().toISOString(),
        };
        try {
            await this.supabase.broadcastDriverLocation(driver.id, locationData);
            this.logger.debug(`Broadcasted location for driver ${driver.id}`);
        }
        catch (error) {
            this.logger.warn(`Failed to broadcast location: ${error.message}`);
        }
        const activeTrip = updatedDriver.trips[0];
        if (activeTrip && this.realtimeGateway) {
            try {
                this.realtimeGateway.server
                    .to(`trip_${activeTrip.id}`)
                    .emit('driver_location', locationData);
                this.logger.debug(`Broadcasted location to trip room: trip_${activeTrip.id}`);
            }
            catch (error) {
                this.logger.warn(`Failed to broadcast to trip room: ${error.message}`);
            }
        }
        return {
            message: 'Location updated successfully',
            location: {
                latitude: dto.latitude,
                longitude: dto.longitude,
                heading: dto.heading,
                speed: dto.speed,
            },
        };
    }
    async getStats(userId) {
        const driver = await this.prisma.driver.findUnique({
            where: { userId },
            include: {
                trips: {
                    where: {
                        status: { in: ['completed', 'cancelled'] },
                    },
                },
                dailyFees: {
                    where: { status: 'paid' },
                },
            },
        });
        if (!driver) {
            throw new common_1.NotFoundException('Driver profile not found');
        }
        const completedTrips = driver.trips.filter(t => t.status === 'completed');
        const cancelledTrips = driver.trips.filter(t => t.status === 'cancelled');
        const totalEarnings = completedTrips.reduce((sum, trip) => sum + (trip.finalFare ? Number(trip.finalFare) : 0), 0);
        const now = new Date();
        const isActive = driver.subscriptionExpiresAt && driver.subscriptionExpiresAt > now;
        let subscriptionStatus = 'inactive';
        if (isActive) {
            subscriptionStatus = 'active';
        }
        else if (driver.subscriptionExpiresAt) {
            const graceEndTime = new Date(driver.subscriptionExpiresAt.getTime() + this.graceHours * 60 * 60 * 1000);
            if (now < graceEndTime) {
                subscriptionStatus = 'grace_period';
            }
        }
        const currentStreak = await this.calculateSubscriptionStreak(driver.id);
        return {
            totalTrips: driver.trips.length,
            completedTrips: completedTrips.length,
            cancelledTrips: cancelledTrips.length,
            totalEarnings,
            averageRating: Number(driver.averageRating) || 0,
            subscriptionStatus,
            subscriptionExpiresAt: driver.subscriptionExpiresAt,
            currentStreak,
        };
    }
    async calculateSubscriptionStreak(driverId) {
        const fees = await this.prisma.dailyFee.findMany({
            where: {
                driverId,
                status: 'paid',
            },
            orderBy: { paidAt: 'desc' },
        });
        if (fees.length === 0)
            return 0;
        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        for (const fee of fees) {
            if (!fee.paidAt)
                continue;
            const feeDate = new Date(fee.paidAt);
            feeDate.setHours(0, 0, 0, 0);
            const daysDiff = Math.floor((currentDate.getTime() - feeDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff === streak) {
                streak++;
                currentDate = feeDate;
            }
            else if (daysDiff > streak) {
                break;
            }
        }
        return streak;
    }
    async getProfile(userId) {
        try {
            this.logger.log(`Getting profile for userId: ${userId}`);
            const driver = await this.prisma.driver.findUnique({
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
                    vehicles: true,
                },
            });
            if (!driver) {
                throw new common_1.NotFoundException('Driver profile not found');
            }
            this.logger.log(`Found driver: ${driver.id}`);
            return {
                id: driver.id,
                user: driver.user,
                licenseNumber: driver.licenseNumber,
                licenseExpiryDate: driver.licenseExpiryDate,
                rating: driver.averageRating ? Number(driver.averageRating) : 0,
                totalTrips: driver.totalTrips || 0,
                status: driver.status,
                subscriptionExpiresAt: driver.subscriptionExpiresAt,
                currentLocation: driver.currentLatitude && driver.currentLongitude ? {
                    latitude: Number(driver.currentLatitude),
                    longitude: Number(driver.currentLongitude),
                } : null,
                vehicles: driver.vehicles || [],
            };
        }
        catch (error) {
            this.logger.error(`Error getting driver profile: ${error.message}`, error.stack);
            throw error;
        }
    }
    setRealtimeGateway(gateway) {
        this.realtimeGateway = gateway;
    }
};
exports.DriversService = DriversService;
exports.DriversService = DriversService = DriversService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        supabase_service_1.SupabaseService])
], DriversService);
//# sourceMappingURL=drivers.service.js.map