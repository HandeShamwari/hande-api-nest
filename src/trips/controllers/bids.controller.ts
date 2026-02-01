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
import { BidsService } from '../services/bids.service';
import { CreateBidDto } from '../dto/create-bid.dto';
import { AcceptBidDto } from '../dto/accept-bid.dto';

@Controller('bids')
@UseGuards(JwtAuthGuard)
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  /**
   * Driver places bid on trip
   * POST /api/bids/trips/:tripId
   */
  @Post('trips/:tripId')
  async createBid(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateBidDto,
  ) {
    return this.bidsService.createBid(tripId, userId, dto);
  }

  /**
   * Get all bids for a trip (rider only)
   * GET /api/bids/trips/:tripId
   */
  @Get('trips/:tripId')
  async getTripBids(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.bidsService.getTripBids(tripId, userId);
  }

  /**
   * Rider accepts a bid
   * POST /api/bids/:bidId/accept
   */
  @Post(':bidId/accept')
  async acceptBid(
    @Param('bidId', ParseUUIDPipe) bidId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.bidsService.acceptBid(bidId, userId);
  }

  /**
   * Get driver's bids
   * GET /api/bids/my-bids?status=pending
   */
  @Get('my-bids')
  async getDriverBids(
    @CurrentUser('sub') userId: string,
    @Query('status') status?: string,
  ) {
    return this.bidsService.getDriverBids(userId, status);
  }
}
