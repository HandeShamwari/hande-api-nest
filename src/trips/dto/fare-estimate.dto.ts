import { IsNumber, IsOptional, IsString, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// ============================================================================
// FARE ESTIMATION DTOs
// ============================================================================

export class LocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsString()
  @IsOptional()
  address?: string;
}

export class FareEstimateRequestDto {
  @ValidateNested()
  @Type(() => LocationDto)
  pickup: LocationDto;

  @ValidateNested()
  @Type(() => LocationDto)
  dropoff: LocationDto;

  @IsEnum(['sedan', 'suv', 'hatchback', 'van', 'truck'])
  @IsOptional()
  vehicleType?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocationDto)
  @IsOptional()
  stops?: LocationDto[];

  @IsString()
  @IsOptional()
  promoCode?: string;
}

export class FareEstimateResponseDto {
  estimatedFare: number;
  currency: string;
  distance: number; // in km
  duration: number; // in minutes
  breakdown: {
    baseFare: number;
    distanceCharge: number;
    timeCharge: number;
    discount?: number;
    total: number;
  };
  vehicleType: string;
  polyline?: string;
  pickup: {
    address: string;
    latitude: number;
    longitude: number;
  };
  dropoff: {
    address: string;
    latitude: number;
    longitude: number;
  };
}

// ============================================================================
// FARE CONFIGURATION (matches Laravel config)
// ============================================================================

export const FARE_CONFIG = {
  baseFare: 2.50,        // Base fare in USD
  perKmRate: 1.00,       // Per kilometer rate
  perMinRate: 0.25,      // Per minute rate
  minFare: 5.00,         // Minimum fare
  bookingFee: 0.50,      // Booking/service fee
  
  // Vehicle type multipliers (no surge pricing per brand rules)
  vehicleMultipliers: {
    sedan: 1.0,
    hatchback: 0.9,
    suv: 1.3,
    van: 1.5,
    truck: 1.6,
  },
};
