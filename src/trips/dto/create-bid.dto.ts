import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateBidDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  proposedFare: number;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  estimatedArrivalMinutes?: number;
}
