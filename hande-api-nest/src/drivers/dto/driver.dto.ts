import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class SubscribeDriverDto {
  @IsNumber()
  @IsOptional()
  amount?: number; // Default to $1 if not provided
}

export class UpdateDriverProfileDto {
  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @IsString()
  @IsOptional()
  licenseExpiry?: string;

  @IsString()
  @IsOptional()
  profilePicture?: string;

  @IsString()
  @IsOptional()
  idDocument?: string;
}

export class UpdateDriverLocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsNumber()
  @IsOptional()
  heading?: number;

  @IsNumber()
  @IsOptional()
  speed?: number;
}

export class DriverStatsResponseDto {
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalEarnings: number;
  averageRating: number;
  subscriptionStatus: 'active' | 'inactive' | 'grace_period';
  subscriptionExpiresAt: Date | null;
  currentStreak: number;
}
