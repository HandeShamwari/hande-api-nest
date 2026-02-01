import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { TripsService } from '../services/trips.service';
import { BidsService } from '../services/bids.service';
import { CreateTripDto } from '../dto/create-trip.dto';
import { CreateBidDto } from '../dto/create-bid.dto';
import { AcceptBidDto } from '../dto/accept-bid.dto';
import { CancelTripDto } from '../dto/cancel-trip.dto';

@Controller('trips')
@UseGuards(JwtAuthGuard)
export class TripsController {
  constructor(
    private readonly tripsService: TripsService,
    private readonly bidsService: BidsService,
  ) {}

  /**
   * Rider creates trip request
   * POST /api/trips/request
   */
  @Post('request')
  async createTrip(
    @CurrentUser('sub') userId: string,
    @Body() createTripDto: CreateTripDto,
  ) {
    return this.tripsService.createTrip(userId, createTripDto);
  }

  /**
   * Get trip details
   * GET /api/trips/:id
   */
  @Get(':id')
  async getTrip(
    @Param('id', ParseUUIDPipe) tripId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.tripsService.getTrip(tripId, userId);
  }

  /**
   * Get nearby trip requests for drivers
   * GET /api/trips/nearby?radius=10
   */
  @Get('nearby/list')
  async getNearbyTrips(
    @CurrentUser('sub') userId: string,
    @Query('radius') radius?: number,
  ) {
    return this.tripsService.getNearbyTrips(userId, radius ? parseInt(radius.toString()) : 10);
  }

  /**
   * Driver accepts trip directly (no bidding)
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
   * Driver starts trip
   * POST /api/trips/:id/start
   */
  @Post(':id/start')
  async startTrip(
    @Param('id', ParseUUIDPipe) tripId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.tripsService.startTrip(tripId, userId);
  }

  /**
   * Complete trip
   * POST /api/trips/:id/complete
   */
  @Post(':id/complete')
  async completeTrip(
    @Param('id', ParseUUIDPipe) tripId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.tripsService.completeTrip(tripId, userId);
  }

  /**
   * Cancel trip
   * POST /api/trips/:id/cancel
   */
  @Post(':id/cancel')
  async cancelTrip(
    @Param('id', ParseUUIDPipe) tripId: string,
    @CurrentUser('sub') userId: string,
    @Body() cancelTripDto: CancelTripDto,
  ) {
    return this.tripsService.cancelTrip(tripId, userId, cancelTripDto);
  }

  /**
   * Driver places bid on trip
   * POST /api/trips/:id/bids
   */
  @Post(':id/bids')
  async createBid(
    @Param('id', ParseUUIDPipe) tripId: string,
    @CurrentUser('sub') userId: string,
    @Body() createBidDto: CreateBidDto,
  ) {
    return this.bidsService.createBid(tripId, userId, createBidDto);
  }

  /**
   * Get all bids for a trip (rider only)
   * GET /api/trips/:id/bids
   */
  @Get(':id/bids')
  async getTripBids(
    @Param('id', ParseUUIDPipe) tripId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.bidsService.getTripBids(tripId, userId);
  }

  /**
   * Rider accepts a bid
   * POST /api/bids/accept
   */
  @Post('bids/accept')
  async acceptBid(
    @CurrentUser('sub') userId: string,
    @Body() acceptBidDto: AcceptBidDto,
  ) {
    return this.bidsService.acceptBid(acceptBidDto.bidId, userId);
  }

  /**
   * Get driver's bids
   * GET /api/trips/my-bids?status=pending
   */
  @Get('my-bids/list')
  async getDriverBids(
    @CurrentUser('sub') userId: string,
    @Query('status') status?: string,
  ) {
    return this.bidsService.getDriverBids(userId, status);
  }

  /**
   * Get rider's trips
   * GET /api/trips/my-trips?status=pending
   */
  @Get('my-trips/list')
  async getRiderTrips(
    @CurrentUser('sub') userId: string,
    @Query('status') status?: string,
  ) {
    return this.tripsService.getRiderTrips(userId, status);
  }

  /**
   * Get driver's trips
   * GET /api/trips/driver-trips?status=completed
   */
  @Get('driver-trips/list')
  async getDriverTrips(
    @CurrentUser('sub') userId: string,
    @Query('status') status?: string,
  ) {
    return this.tripsService.getDriverTrips(userId, status);
  }
}
