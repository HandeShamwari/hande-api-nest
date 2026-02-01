import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { TripsService } from '../services/trips.service';
import { CreateTripDto } from '../dto/create-trip.dto';
import { UpdateTripStatusDto } from '../dto/update-trip-status.dto';

@Controller('trips')
@UseGuards(JwtAuthGuard)
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  /**
   * Rider: Create new trip request
   * POST /api/trips/request
   */
  @Post('request')
  async createTrip(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateTripDto,
  ) {
    return this.tripsService.createTrip(userId, dto);
  }

  /**
   * Get trip details by ID
   * GET /api/trips/:id
   */
  @Get(':id')
  async getTripById(
    @Param('id', ParseUUIDPipe) tripId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.tripsService.getTripById(tripId, userId);
  }

  /**
   * Driver: Get nearby pending trips
   * GET /api/trips/nearby
   */
  @Get('nearby/available')
  async getNearbyTrips(@CurrentUser('sub') userId: string) {
    return this.tripsService.getNearbyTrips(userId);
  }

  /**
   * Driver: Accept trip without bidding
   * POST /api/trips/:id/accept
   */
  @Post(':id/accept')
  async acceptTrip(
    @Param('id', ParseUUIDPipe) tripId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.tripsService.acceptTrip(tripId, userId);
  }

  /**
   * Update trip status (start, complete, cancel)
   * PUT /api/trips/:id/status
   */
  @Put(':id/status')
  async updateTripStatus(
    @Param('id', ParseUUIDPipe) tripId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateTripStatusDto,
  ) {
    return this.tripsService.updateTripStatus(tripId, userId, dto);
  }

  /**
   * Get rider's trip history
   * GET /api/trips/rider/history
   */
  @Get('rider/history')
  async getRiderTrips(@CurrentUser('sub') userId: string) {
    return this.tripsService.getRiderTrips(userId);
  }

  /**
   * Get driver's trip history
   * GET /api/trips/driver/history
   */
  @Get('driver/history')
  async getDriverTrips(@CurrentUser('sub') userId: string) {
    return this.tripsService.getDriverTrips(userId);
  }
}
