import { PrismaService } from '../shared/services/prisma.service';
export declare class HealthController {
    private prisma;
    constructor(prisma: PrismaService);
    check(): Promise<{
        status: string;
        database: string;
        timestamp: string;
        env: {
            nodeEnv: string | undefined;
            hasDatabase: boolean;
            hasJwtSecret: boolean;
        };
        error?: undefined;
    } | {
        status: string;
        database: string;
        error: any;
        timestamp: string;
        env?: undefined;
    }>;
}
