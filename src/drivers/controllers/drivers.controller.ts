import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
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
  GoOnlineDto,
  GoOfflineDto,
  PayDailyFeeDto,
  DailyFeeHistoryQueryDto,
} from '../dto/driver.dto';

@Controller('drivers')
@UseGuards(JwtAuthGuard)
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  // ============================================================================
  // SUBSCRIPTION ENDPOINTS
  // ============================================================================

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

  // ============================================================================
  // STATUS MANAGEMENT ENDPOINTS
  // ============================================================================

  /**
   * GET /api/drivers/status
   * Get current driver status (online/offline/on-trip)
   */
  @Get('status')
  async getCurrentStatus(@CurrentUser('sub') userId: string) {
    return this.driversService.getCurrentStatus(userId);
  }

  /**
   * POST /api/drivers/online
   * Go online to accept ride requests
   */
  @Post('online')
  @HttpCode(HttpStatus.OK)
  async goOnline(
    @CurrentUser('sub') userId: string,
    @Body() dto: GoOnlineDto,
  ) {
    return this.driversService.goOnline(userId, dto);
  }

  /**
   * POST /api/drivers/offline
   * Go offline to stop accepting rides
   */
  @Post('offline')
  @HttpCode(HttpStatus.OK)
  async goOffline(
    @CurrentUser('sub') userId: string,
    @Body() dto: GoOfflineDto,
  ) {
    return this.driversService.goOffline(userId, dto);
  }

  // ============================================================================
  // DAILY FEE ENDPOINTS
  // ============================================================================

  /**
   * GET /api/drivers/daily-fee/status
   * Get current daily fee status
   */
  @Get('daily-fee/status')
  async getDailyFeeStatus(@CurrentUser('sub') userId: string) {
    return this.driversService.getDailyFeeStatus(userId);
  }

  /**
   * POST /api/drivers/daily-fee/pay
   * Pay daily fee (single day or multiple days)
   */
  @Post('daily-fee/pay')
  @HttpCode(HttpStatus.OK)
  async payDailyFee(
    @CurrentUser('sub') userId: string,
    @Body() dto: PayDailyFeeDto,
  ) {
    return this.driversService.payDailyFee(userId, dto);
  }

  /**
   * GET /api/drivers/daily-fee/history
   * Get daily fee payment history
   */
  @Get('daily-fee/history')
  async getDailyFeeHistory(
    @CurrentUser('sub') userId: string,
    @Query() query: DailyFeeHistoryQueryDto,
  ) {
    return this.driversService.getDailyFeeHistory(userId, query);
  }

  // ============================================================================
  // PROFILE ENDPOINTS
  // ============================================================================

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

  // ============================================================================
  // LOCATION ENDPOINTS
  // ============================================================================

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

  // ============================================================================
  // STATS ENDPOINTS
  // ============================================================================

  /**
   * GET /api/drivers/stats
   * Get driver statistics and earnings
   */
  @Get('stats')
  async getStats(@CurrentUser('sub') userId: string) {
    return this.driversService.getStats(userId);
  }

  /**
   * GET /api/drivers/earnings
   * Get detailed earnings breakdown
   */
  @Get('earnings')
  async getEarnings(
    @CurrentUser('sub') userId: string,
    @Query('period') period?: 'today' | 'week' | 'month' | 'all',
  ) {
    return this.driversService.getEarnings(userId, period);
  }
}
