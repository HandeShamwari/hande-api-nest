import { DriversService } from '../services/drivers.service';
import { SubscribeDriverDto, UpdateDriverProfileDto, UpdateDriverLocationDto } from '../dto/driver.dto';
export declare class DriversController {
    private readonly driversService;
    constructor(driversService: DriversService);
    subscribe(userId: string, dto: SubscribeDriverDto): Promise<{
        message: string;
        subscription: {
            id: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
            expiresAt: Date | null;
            status: import("@prisma/client").$Enums.FeeStatus;
        };
    }>;
    getSubscriptionStatus(userId: string): Promise<{
        driverId: string;
        status: "grace_period" | "active" | "inactive";
        expiresAt: Date | null;
        canAcceptRides: boolean;
        recentPayments: {
            id: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
            paidAt: Date | null;
            expiresAt: Date | null;
            status: import("@prisma/client").$Enums.FeeStatus;
        }[];
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        user: {
            firstName: string;
            lastName: string;
            email: string;
            phone: string | null;
            id: string;
        };
        licenseNumber: string;
        licenseExpiryDate: Date;
        rating: number;
        totalTrips: number;
        status: import("@prisma/client").$Enums.DriverStatus;
        subscriptionExpiresAt: Date | null;
        currentLocation: {
            latitude: number;
            longitude: number;
        } | null;
        vehicles: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.VehicleStatus;
            year: number;
            driverId: string;
            make: string;
            model: string;
            color: string;
            licensePlate: string;
            vehicleIdentificationNumber: string | null;
            registrationDocument: string | null;
            insuranceDocument: string | null;
            type: string;
            capacity: number;
            seats: number;
            photo: string | null;
            photos: string | null;
            inspectionStatus: string | null;
            inspectionExpiry: Date | null;
            insuranceExpiry: Date | null;
            rejectionReason: string | null;
        }[];
    }>;
    updateProfile(userId: string, dto: UpdateDriverProfileDto): Promise<{
        message: string;
        driver: {
            id: string;
            licenseNumber: string;
            licenseExpiryDate: Date;
            status: import("@prisma/client").$Enums.DriverStatus;
        };
    }>;
    updateLocation(userId: string, dto: UpdateDriverLocationDto): Promise<{
        message: string;
        location: {
            latitude: number;
            longitude: number;
            heading: number | undefined;
            speed: number | undefined;
        };
    }>;
    getStats(userId: string): Promise<import("../dto/driver.dto").DriverStatsResponseDto>;
}
