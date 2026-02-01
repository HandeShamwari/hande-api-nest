import { IsEmail, IsEnum, IsString, MinLength, IsOptional } from 'class-validator';

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
}
