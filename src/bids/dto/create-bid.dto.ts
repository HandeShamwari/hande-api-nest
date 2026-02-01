import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateBidDto {
  @IsNotEmpty()
  @IsUUID()
  tripId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  estimatedTime?: number; // in minutes

  @IsOptional()
  @IsString()
  message?: string;
}
