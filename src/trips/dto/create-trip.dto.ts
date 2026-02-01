import { IsNotEmpty, IsNumber, IsString, IsOptional, Min, Max, IsEnum } from 'class-validator';

export class CreateTripDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  pickupLatitude: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  pickupLongitude: number;

  @IsNotEmpty()
  @IsString()
  pickupAddress: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  destinationLatitude: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  destinationLongitude: number;

  @IsNotEmpty()
  @IsString()
  destinationAddress: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(['sedan', 'suv', 'minivan', 'luxury'])
  vehicleType?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  passengerCount?: number;
}
