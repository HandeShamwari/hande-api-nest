import { IsNotEmpty, IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

export class CreateTripDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  startLatitude: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  startLongitude: number;

  @IsNotEmpty()
  @IsString()
  startAddress: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  endLatitude: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  endLongitude: number;

  @IsNotEmpty()
  @IsString()
  endAddress: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
