import { IsEmail, IsString, IsOptional } from 'class-validator';

export class GoogleAuthDto {
  @IsEmail()
  email: string;

  @IsString()
  googleId: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  profileImage?: string;
}
