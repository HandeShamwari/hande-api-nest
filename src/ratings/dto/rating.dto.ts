import { IsUUID, IsInt, Min, Max, IsString, IsOptional } from 'class-validator';

export class CreateRatingDto {
  @IsUUID()
  tripId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  feedback?: string;
}

export class RatingResponseDto {
  id: string;
  tripId: string;
  driverId: string;
  riderId: string;
  rating: number;
  feedback?: string;
  createdAt: Date;
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  rider?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export class RatingStatsDto {
  averageRating: number;
  totalRatings: number;
  breakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
