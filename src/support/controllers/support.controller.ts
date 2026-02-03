import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SupportService } from '../services/support.service';
import { CreateSupportTicketDto, UpdateSupportTicketDto } from '../dto/support.dto';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  /**
   * Create support ticket
   * POST /api/support/tickets
   */
  @Post('tickets')
  async createTicket(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateSupportTicketDto,
  ) {
    return this.supportService.createTicket(userId, dto);
  }

  /**
   * Get my tickets
   * GET /api/support/tickets
   */
  @Get('tickets')
  async getMyTickets(
    @CurrentUser('sub') userId: string,
    @Query('status') status?: string,
  ) {
    return this.supportService.getMyTickets(userId, status);
  }

  /**
   * Get ticket counts by status
   * GET /api/support/tickets/counts
   */
  @Get('tickets/counts')
  async getTicketCounts(@CurrentUser('sub') userId: string) {
    return this.supportService.getTicketCounts(userId);
  }

  /**
   * Get ticket details
   * GET /api/support/tickets/:id
   */
  @Get('tickets/:id')
  async getTicket(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) ticketId: string,
  ) {
    return this.supportService.getTicket(userId, ticketId);
  }

  /**
   * Update ticket
   * PUT /api/support/tickets/:id
   */
  @Put('tickets/:id')
  async updateTicket(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) ticketId: string,
    @Body() dto: UpdateSupportTicketDto,
  ) {
    return this.supportService.updateTicket(userId, ticketId, dto);
  }

  /**
   * Close ticket
   * PUT /api/support/tickets/:id/close
   */
  @Put('tickets/:id/close')
  async closeTicket(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) ticketId: string,
  ) {
    return this.supportService.closeTicket(userId, ticketId);
  }
}
