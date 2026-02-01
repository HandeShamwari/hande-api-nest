import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    debug(user: any): Promise<{
        fullUser: any;
        sub: any;
        id: any;
    }>;
}
