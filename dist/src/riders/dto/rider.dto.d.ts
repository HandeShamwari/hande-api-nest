export declare class UpdateRiderProfileDto {
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    profilePicture?: string;
    homeAddress?: string;
    homeLatitude?: number;
    homeLongitude?: number;
}
export declare class RiderStatsResponseDto {
    totalTrips: number;
    completedTrips: number;
    cancelledTrips: number;
    totalSpent: number;
    averageRating: number;
    favoriteDestinations: Array<{
        address: string;
        count: number;
    }>;
}
