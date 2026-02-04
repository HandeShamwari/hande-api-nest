import { Injectable, UnauthorizedException, ConflictException, Logger, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../shared/services/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      this.logger.log(`Registration attempt for: ${registerDto.email}`);
      
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

      // Create driver or rider profile based on userType
      if (registerDto.userType === 'driver') {
        // Set license expiry 5 years from now as default
        const licenseExpiry = new Date();
        licenseExpiry.setFullYear(licenseExpiry.getFullYear() + 5);
        
        this.logger.log(`Creating driver profile for user: ${user.id}`);
        const driver = await this.prisma.driver.create({
          data: {
            userId: user.id,
            licenseNumber: registerDto.licenseNumber || 'PENDING',
            licenseExpiryDate: licenseExpiry,
            licenseType: 'B',
            yearsOfExperience: 0,
          },
        });

        // Create vehicle if vehicle info provided
        if (registerDto.vehiclePlate || registerDto.vehicleMake) {
          this.logger.log(`Creating vehicle for driver: ${driver.id}`);
          await this.prisma.vehicle.create({
            data: {
              driverId: driver.id,
              type: registerDto.vehicleType || 'sedan',
              make: registerDto.vehicleMake || '',
              model: registerDto.vehicleModel || '',
              year: registerDto.vehicleYear || new Date().getFullYear(),
              color: registerDto.vehicleColor || '',
              plateNumber: registerDto.vehiclePlate || '',
              isActive: true,
            },
          });
        }
      } else if (registerDto.userType === 'rider') {
        this.logger.log(`Creating rider profile for user: ${user.id}`);
        await this.prisma.rider.create({
          data: {
            userId: user.id,
          },
        });
      }

      // Generate JWT token
      this.logger.log(`Generating token for user: ${user.id}`);
      const token = this.generateToken(user.id, user.email, user.userType);

      this.logger.log(`Registration successful for: ${registerDto.email}`);
      return {
        user,
        token,
      };
    } catch (error) {
      this.logger.error(`Registration failed for ${registerDto.email}:`, error.message, error.stack);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Registration failed. Please try again.');
    }
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

  async googleAuth(googleAuthDto: GoogleAuthDto) {
    const { email, googleId, firstName, lastName, profileImage } = googleAuthDto;
    this.logger.log(`Google auth attempt for: ${email}`);

    try {
      // Check if user exists by email or googleId
      let user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { googleId },
          ],
        },
      });

      if (!user) {
        // Create new user with Google
        this.logger.log(`Creating new user with Google: ${email}`);
        user = await this.prisma.user.create({
          data: {
            email,
            firstName: firstName || '',
            lastName: lastName || '',
            googleId,
            profileImage,
            password: '', // No password for Google users
            userType: 'rider',
            activeRole: 'rider',
          },
        });

        // Create rider profile
        await this.prisma.rider.create({
          data: { userId: user.id },
        });
      } else if (!user.googleId) {
        // Link Google account to existing user
        this.logger.log(`Linking Google account to existing user: ${email}`);
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            profileImage: profileImage || user.profileImage,
          },
        });
      }

      const token = this.generateToken(user.id, user.email, user.userType);

      this.logger.log(`Google auth successful for: ${email}`);
      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType,
          activeRole: user.activeRole,
          profileImage: user.profileImage,
        },
        accessToken: token,
      };
    } catch (error) {
      this.logger.error(`Google auth failed for ${email}:`, error.message, error.stack);
      throw new InternalServerErrorException('Google authentication failed. Please try again.');
    }
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
