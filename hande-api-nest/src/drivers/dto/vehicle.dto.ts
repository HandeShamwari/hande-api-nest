import { IsEnum, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  make: string;

  @IsString()
  model: string;

  @IsNumber()
  year: number;

  @IsString()
  licensePlate: string;

  @IsString()
  color: string;

  @IsEnum(['sedan', 'suv', 'hatchback', 'van', 'truck'])
  type: string;

  @IsNumber()
  @IsOptional()
  seats?: number;

  @IsString()
  @IsOptional()
  photo?: string;
}

export class UpdateVehicleDto {
  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  photo?: string;

  @IsString()
  @IsOptional()
  licensePlate?: string;
}
