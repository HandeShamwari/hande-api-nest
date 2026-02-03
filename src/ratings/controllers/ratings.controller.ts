import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RatingsService } from '../services/ratings.service';
import { CreateRatingDto } from '../dto/rating.dto';

@Controller('ratings')
@UseGuards(JwtAuthGuard)
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  /**
   * Rider: Rate a driver after trip
   * POST /api/ratings/driver
   */
  @Post('driver')
  async rateDriver(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateRatingDto,
  ) {
    return this.ratingsService.rateDriver(userId, dto);
  }

  /**
   * Get my ratings (as driver)
   * GET /api/ratings/my
   */
  @Get('my')
  async getMyRatings(
    @CurrentUser('sub') userId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.ratingsService.getMyRatings(userId, limit || 20);
  }

  /**
   * Get my rating stats (as driver)
   * GET /api/ratings/my/stats
   */
  @Get('my/stats')
  async getMyRatingStats(@CurrentUser('sub') userId: string) {
    return this.ratingsService.getMyRatingStats(userId);
  }

  /**
   * Get rating for a specific trip
   * GET /api/ratings/trip/:tripId
   */
  @Get('trip/:tripId')
  async getTripRating(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.ratingsService.getTripRating(tripId, userId);
  }

  /**
   * Get driver's public ratings
   * GET /api/ratings/driver/:driverId
   */
  @Get('driver/:driverId')
  async getDriverRatings(
    @Param('driverId', ParseUUIDPipe) driverId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.ratingsService.getDriverRatings(driverId, limit || 20);
  }

  /**
   * Get driver's rating stats
   * GET /api/ratings/driver/:driverId/stats
   */
  @Get('driver/:driverId/stats')
  async getDriverRatingStats(
    @Param('driverId', ParseUUIDPipe) driverId: string,
  ) {
    return this.ratingsService.getDriverRatingStats(driverId);
  }
}
