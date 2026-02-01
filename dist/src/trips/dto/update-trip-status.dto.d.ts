export declare enum TripStatusUpdate {
    ACCEPTED = "accepted",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare class UpdateTripStatusDto {
    status: TripStatusUpdate;
    cancellationReason?: string;
}
