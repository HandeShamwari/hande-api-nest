import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../shared/services/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(registerDto: RegisterDto): Promise<{
        user: {
            firstName: string;
            lastName: string;
            email: string;
            userType: import("@prisma/client").$Enums.UserType;
            id: string;
            activeRole: import("@prisma/client").$Enums.UserType | null;
        };
        token: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            userType: import("@prisma/client").$Enums.UserType;
            activeRole: import("@prisma/client").$Enums.UserType | null;
        };
        token: string;
    }>;
    private generateToken;
    me(userId: string): Promise<{
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
        userType: import("@prisma/client").$Enums.UserType;
        id: string;
        activeRole: import("@prisma/client").$Enums.UserType | null;
        profileImage: string | null;
        isActive: boolean;
        createdAt: Date;
    } | null>;
}
