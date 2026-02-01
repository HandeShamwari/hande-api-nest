import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../shared/services/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if user exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: registerDto.email },
          { phone: registerDto.phone || '' },
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user
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

    // Create driver or rider profile based on userType
    if (registerDto.userType === 'driver') {
      await this.prisma.driver.create({
        data: {
          userId: user.id,
          licenseNumber: 'PENDING',
          licenseExpiryDate: new Date(),
          licenseType: 'B',
        },
      });
    } else if (registerDto.userType === 'rider') {
      await this.prisma.rider.create({
        data: {
          userId: user.id,
        },
      });
    }

    // Generate JWT token
    const token = this.generateToken(user.id, user.email, user.userType);

    return {
      user,
      token,
    };
  }

  async login(loginDto: LoginDto) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Generate JWT token
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

  private generateToken(userId: string, email: string, userType: string) {
    const payload = { sub: userId, email, userType };
    return this.jwtService.sign(payload);
  }

  async me(userId: string) {
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
}
