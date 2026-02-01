export declare class CreateVehicleDto {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    color: string;
    type: string;
    capacity?: number;
    seats?: number;
    photo?: string;
}
export declare class UpdateVehicleDto {
    color?: string;
    photo?: string;
    licensePlate?: string;
}
