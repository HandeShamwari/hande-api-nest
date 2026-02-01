import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DriversService } from '../services/drivers.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import {
  SubscribeDriverDto,
  UpdateDriverProfileDto,
  UpdateDriverLocationDto,
} from '../dto/driver.dto';

@Controller('drivers')
@UseGuards(JwtAuthGuard)
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  /**
   * POST /api/drivers/subscribe
   * Subscribe to daily $1 fee
   */
  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  async subscribe(
    @CurrentUser('sub') userId: string,
    @Body() dto: SubscribeDriverDto,
  ) {
    return this.driversService.subscribe(userId, dto);
  }

  /**
   * GET /api/drivers/subscription
   * Get subscription status
   */
  @Get('subscription')
  async getSubscriptionStatus(@CurrentUser('sub') userId: string) {
    return this.driversService.getSubscriptionStatus(userId);
  }

  /**
   * GET /api/drivers/profile
   * Get driver profile
   */
  @Get('profile')
  async getProfile(@CurrentUser('sub') userId: string) {
    return this.driversService.getProfile(userId);
  }

  /**
   * PUT /api/drivers/profile
   * Update driver profile
   */
  @Put('profile')
  async updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateDriverProfileDto,
  ) {
    return this.driversService.updateProfile(userId, dto);
  }

  /**
   * POST /api/drivers/location
   * Update driver location (real-time)
   */
  @Post('location')
  @HttpCode(HttpStatus.OK)
  async updateLocation(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateDriverLocationDto,
  ) {
    return this.driversService.updateLocation(userId, dto);
  }

  /**
   * GET /api/drivers/stats
   * Get driver statistics and earnings
   */
  @Get('stats')
  async getStats(@CurrentUser('sub') userId: string) {
    return this.driversService.getStats(userId);
  }
}
