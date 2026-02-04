import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('google')
  async googleAuth(@Body() googleAuthDto: GoogleAuthDto) {
    return this.authService.googleAuth(googleAuthDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser('sub') userId: string) {
    return this.authService.me(userId);
  }

  @Get('debug')
  @UseGuards(JwtAuthGuard)
  async debug(@CurrentUser() user: any) {
    return {
      fullUser: user,
      sub: user?.sub,
      id: user?.id,
    };
  }
}
