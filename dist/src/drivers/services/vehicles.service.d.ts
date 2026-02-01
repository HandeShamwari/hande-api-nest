import { PrismaService } from '../../shared/services/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from '../dto/vehicle.dto';
export declare class VehiclesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreateVehicleDto): Promise<{
        message: string;
        vehicle: {
            id: string;
            make: string;
            model: string;
            year: number;
            licensePlate: string;
            status: import("@prisma/client").$Enums.VehicleStatus;
        };
    }>;
    findAll(userId: string): Promise<{
        id: string;
        make: string;
        model: string;
        year: number;
        licensePlate: string;
        color: string;
        type: string;
        seats: number;
        photo: string | null;
        status: import("@prisma/client").$Enums.VehicleStatus;
        isActive: boolean;
    }[]>;
    findOne(userId: string, vehicleId: string): Promise<{
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
    }>;
    update(userId: string, vehicleId: string, dto: UpdateVehicleDto): Promise<{
        message: string;
        vehicle: {
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
        };
    }>;
    remove(userId: string, vehicleId: string): Promise<{
        message: string;
    }>;
    setActive(userId: string, vehicleId: string): Promise<{
        message: string;
    }>;
}
