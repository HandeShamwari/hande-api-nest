import { SupabaseService } from '../shared/services/supabase.service';
export declare class UploadController {
    private supabaseService;
    constructor(supabaseService: SupabaseService);
    uploadLicense(userId: string, file: Express.Multer.File): Promise<{
        message: string;
        url: any;
    }>;
    uploadVehicleImage(userId: string, file: Express.Multer.File): Promise<{
        message: string;
        url: any;
    }>;
    uploadProfileImage(userId: string, file: Express.Multer.File): Promise<{
        message: string;
        url: any;
    }>;
}
