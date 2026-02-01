import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum TripStatusUpdate {
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class UpdateTripStatusDto {
  @IsEnum(TripStatusUpdate)
  status: TripStatusUpdate;

  @IsOptional()
  @IsString()
  cancellationReason?: string;
}
