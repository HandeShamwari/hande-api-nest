export declare class SubscribeDriverDto {
    amount?: number;
}
export declare class UpdateDriverProfileDto {
    licenseNumber?: string;
    licenseExpiry?: string;
    profilePicture?: string;
    idDocument?: string;
}
export declare class UpdateDriverLocationDto {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
}
export declare class DriverStatsResponseDto {
    totalTrips: number;
    completedTrips: number;
    cancelledTrips: number;
    totalEarnings: number;
    averageRating: number;
    subscriptionStatus: 'active' | 'inactive' | 'grace_period';
    subscriptionExpiresAt: Date | null;
    currentStreak: number;
}
