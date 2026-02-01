import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { BidsService } from '../services/bids.service';
import { CreateBidDto } from '../dto/create-bid.dto';

@Controller('bids')
@UseGuards(JwtAuthGuard)
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  /**
   * Driver: Place a bid on a trip
   * POST /api/bids
   */
  @Post()
  async createBid(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateBidDto,
  ) {
    return this.bidsService.createBid(userId, dto);
  }

  /**
   * Rider: Get all bids for a trip
   * GET /api/bids/trip/:tripId
   */
  @Get('trip/:tripId')
  async getTripBids(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.bidsService.getTripBids(tripId, userId);
  }

  /**
   * Rider: Accept a bid
   * POST /api/bids/:id/accept
   */
  @Post(':id/accept')
  async acceptBid(
    @Param('id', ParseUUIDPipe) bidId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.bidsService.acceptBid(bidId, userId);
  }

  /**
   * Driver: Get bid history
   * GET /api/bids/driver/history
   */
  @Get('driver/history')
  async getDriverBids(@CurrentUser('sub') userId: string) {
    return this.bidsService.getDriverBids(userId);
  }
}
