import { IsNumber, IsOptional, IsString } from 'class-validator';

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
