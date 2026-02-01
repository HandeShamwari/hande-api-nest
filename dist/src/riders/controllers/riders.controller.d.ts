import { RidersService } from '../services/riders.service';
import { UpdateRiderProfileDto } from '../dto/rider.dto';
export declare class RidersController {
    private readonly ridersService;
    constructor(ridersService: RidersService);
    getProfile(userId: string): Promise<{
        id: string;
        user: {
            firstName: string;
            lastName: string;
            email: string;
            phone: string | null;
            id: string;
        };
        emergencyContacts: {
            phone: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            riderId: string;
            relationship: string | null;
            isPrimary: boolean;
        }[];
        rating: number;
        totalTrips: number;
        favoriteLocations: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            latitude: import("@prisma/client-runtime-utils").Decimal;
            longitude: import("@prisma/client-runtime-utils").Decimal;
            riderId: string;
            type: string | null;
            address: string;
        }[];
    }>;
    updateProfile(userId: string, dto: UpdateRiderProfileDto): Promise<{
        message: string;
        rider: {
            id: string;
        };
    }>;
    getStats(userId: string): Promise<import("../dto/rider.dto").RiderStatsResponseDto>;
    getRecentTrips(userId: string, limit?: number): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.TripStatus;
        startAddress: string;
        endAddress: string;
        fare: number;
        createdAt: Date;
        completedAt: Date | null;
        driver: {
            name: string;
            rating: number;
        } | null;
    }[]>;
}
