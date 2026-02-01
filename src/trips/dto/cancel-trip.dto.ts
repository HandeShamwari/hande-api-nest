import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CancelTripDto {
  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  cancelledBy?: 'rider' | 'driver';
}
