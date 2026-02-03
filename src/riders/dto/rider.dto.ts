import { IsNumber, IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';

// ============================================================================
// SAVED LOCATIONS DTOs
// ============================================================================

export enum LocationType {
  HOME = 'home',
  WORK = 'work',
  OTHER = 'other',
}

export class CreateSavedLocationDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsEnum(LocationType)
  @IsOptional()
  type?: LocationType;
}

export class UpdateSavedLocationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsEnum(LocationType)
  @IsOptional()
  type?: LocationType;
}

// ============================================================================
// EMERGENCY CONTACTS DTOs
// ============================================================================

export class CreateEmergencyContactDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsString()
  @IsOptional()
  relationship?: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

export class UpdateEmergencyContactDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  relationship?: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

// ============================================================================
// RIDER PROFILE DTOs
// ============================================================================

export class UpdateRiderProfileDto {
  @IsString()
  @IsOptional()
  emergencyContactName?: string;

  @IsString()
  @IsOptional()
  emergencyContactPhone?: string;

  @IsString()
  @IsOptional()
  profilePicture?: string;

  @IsString()
  @IsOptional()
  homeAddress?: string;

  @IsNumber()
  @IsOptional()
  homeLatitude?: number;

  @IsNumber()
  @IsOptional()
  homeLongitude?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  paymentPreferences?: string;
}

export class UpdateRiderLocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}

export class RiderStatsResponseDto {
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalSpent: number;
  averageRating: number;
  favoriteDestinations: Array<{
    address: string;
    count: number;
  }>;
}
