"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../shared/services/prisma.service");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async register(registerDto) {
        try {
            this.logger.log(`Registration attempt for: ${registerDto.email}`);
            const existingUser = await this.prisma.user.findFirst({
                where: {
                    OR: [
                        { email: registerDto.email },
                        { phone: registerDto.phone || '' },
                    ],
                },
            });
            if (existingUser) {
                throw new common_1.ConflictException('User with this email or phone already exists');
            }
            const hashedPassword = await bcrypt.hash(registerDto.password, 10);
            this.logger.log(`Creating user: ${registerDto.email}`);
            const user = await this.prisma.user.create({
                data: {
                    firstName: registerDto.firstName,
                    lastName: registerDto.lastName,
                    email: registerDto.email,
                    password: hashedPassword,
                    phone: registerDto.phone,
                    userType: registerDto.userType,
                    activeRole: registerDto.userType,
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    userType: true,
                    activeRole: true,
                },
            });
            if (registerDto.userType === 'driver') {
                const licenseExpiry = new Date();
                licenseExpiry.setFullYear(licenseExpiry.getFullYear() + 5);
                this.logger.log(`Creating driver profile for user: ${user.id}`);
                await this.prisma.driver.create({
                    data: {
                        userId: user.id,
                        licenseNumber: 'PENDING',
                        licenseExpiryDate: licenseExpiry,
                        licenseType: 'B',
                        yearsOfExperience: 0,
                    },
                });
            }
            else if (registerDto.userType === 'rider') {
                this.logger.log(`Creating rider profile for user: ${user.id}`);
                await this.prisma.rider.create({
                    data: {
                        userId: user.id,
                    },
                });
            }
            this.logger.log(`Generating token for user: ${user.id}`);
            const token = this.generateToken(user.id, user.email, user.userType);
            this.logger.log(`Registration successful for: ${registerDto.email}`);
            return {
                user,
                token,
            };
        }
        catch (error) {
            this.logger.error(`Registration failed for ${registerDto.email}:`, error.message, error.stack);
            if (error instanceof common_1.ConflictException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Registration failed. Please try again.');
        }
    }
    async login(loginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: loginDto.email },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const passwordMatch = await bcrypt.compare(loginDto.password, user.password);
        if (!passwordMatch) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account is inactive');
        }
        const token = this.generateToken(user.id, user.email, user.userType);
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                userType: user.userType,
                activeRole: user.activeRole,
            },
            token,
        };
    }
    generateToken(userId, email, userType) {
        const payload = { sub: userId, email, userType };
        return this.jwtService.sign(payload);
    }
    async me(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                userType: true,
                activeRole: true,
                profileImage: true,
                isActive: true,
                createdAt: true,
            },
        });
        return user;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map