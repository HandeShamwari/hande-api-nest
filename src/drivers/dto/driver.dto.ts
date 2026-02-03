import { IsNumber, IsOptional, IsString, IsUUID, IsEnum, IsDateString } from 'class-validator';

export class SubscribeDriverDto {
  @IsNumber()
  @IsOptional()
  amount?: number; // Default to $1 if not provided
}

// ============================================================================
// STATUS MANAGEMENT DTOs
// ============================================================================

export enum DriverStatusEnum {
  AVAILABLE = 'available',
  ON_TRIP = 'on_trip',
  OFF_DUTY = 'off_duty',
  SUSPENDED = 'suspended',
}

export class UpdateDriverStatusDto {
  @IsEnum(DriverStatusEnum)
  status: DriverStatusEnum;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class GoOnlineDto {
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;
}

export class GoOfflineDto {
  @IsString()
  @IsOptional()
  reason?: string;
}

// ============================================================================
// DAILY FEE DTOs
// ============================================================================

export class PayDailyFeeDto {
  @IsString()
  @IsOptional()
  paymentMethodId?: string; // Optional: use default payment method if not provided

  @IsNumber()
  @IsOptional()
  days?: number; // Pay for multiple days at once
}

export class DailyFeeHistoryQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(['paid', 'pending', 'grace_period', 'overdue', 'suspended', 'waived'])
  status?: string;
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

// ============================================================================
// SHIFT MANAGEMENT DTOs
// ============================================================================

export class StartShiftDto {
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;
}

export class EndShiftDto {
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ShiftSummaryDto {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // minutes
  earnings: number;
  tripCount: number;
  isActive: boolean;
}

export class ShiftHistoryQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  limit?: number;
}
