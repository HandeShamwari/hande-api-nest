import { IsEmail, IsEnum, IsString, MinLength, IsOptional, IsNumber } from 'class-validator';

export enum UserType {
  ADMIN = 'admin',
  DRIVER = 'driver',
  RIDER = 'rider',
}

export class RegisterDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(UserType)
  userType: UserType;

  // Driver-specific fields (optional, only used when userType is 'driver')
  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @IsString()
  @IsOptional()
  vehicleType?: string;

  @IsString()
  @IsOptional()
  vehicleMake?: string;

  @IsString()
  @IsOptional()
  vehicleModel?: string;

  @IsNumber()
  @IsOptional()
  vehicleYear?: number;

  @IsString()
  @IsOptional()
  vehiclePlate?: string;

  @IsString()
  @IsOptional()
  vehicleColor?: string;
}
