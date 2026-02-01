import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { RidersService } from '../services/riders.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UpdateRiderProfileDto } from '../dto/rider.dto';

@Controller('riders')
@UseGuards(JwtAuthGuard)
export class RidersController {
  constructor(private readonly ridersService: RidersService) {}

  /**
   * GET /api/riders/profile
   * Get rider profile
   */
  @Get('profile')
  async getProfile(@CurrentUser('sub') userId: string) {
    return this.ridersService.getProfile(userId);
  }

  /**
   * PUT /api/riders/profile
   * Update rider profile
   */
  @Put('profile')
  async updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateRiderProfileDto,
  ) {
    return this.ridersService.updateProfile(userId, dto);
  }

  /**
   * GET /api/riders/stats
   * Get rider statistics
   */
  @Get('stats')
  async getStats(@CurrentUser('sub') userId: string) {
    return this.ridersService.getStats(userId);
  }

  /**
   * GET /api/riders/trips
   * Get recent trips
   */
  @Get('trips')
  async getRecentTrips(
    @CurrentUser('sub') userId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.ridersService.getRecentTrips(userId, limit);
  }
}
