import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PaymentsService } from '../services/payments.service';
import { ProcessPaymentDto, AddWalletFundsDto } from '../dto/payment.dto';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ============================================================================
  // RIDER PAYMENT ENDPOINTS
  // ============================================================================

  /**
   * Get wallet balance (rider)
   * GET /api/payments/wallet
   */
  @Get('wallet')
  async getWalletBalance(@CurrentUser('sub') userId: string) {
    return this.paymentsService.getWalletBalance(userId);
  }

  /**
   * Get payment history (rider)
   * GET /api/payments/history
   */
  @Get('history')
  async getPaymentHistory(
    @CurrentUser('sub') userId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.paymentsService.getPaymentHistory(userId, limit || 20);
  }

  /**
   * Process payment for trip (rider)
   * POST /api/payments/process
   */
  @Post('process')
  @HttpCode(HttpStatus.OK)
  async processPayment(
    @CurrentUser('sub') userId: string,
    @Body() dto: ProcessPaymentDto,
  ) {
    return this.paymentsService.processPayment(userId, dto);
  }

  // ============================================================================
  // DRIVER PAYMENT ENDPOINTS
  // ============================================================================

  /**
   * Get driver wallet balance
   * GET /api/payments/driver/wallet
   */
  @Get('driver/wallet')
  async getDriverWalletBalance(@CurrentUser('sub') userId: string) {
    return this.paymentsService.getDriverWalletBalance(userId);
  }

  /**
   * Get driver payment history (payouts)
   * GET /api/payments/driver/history
   */
  @Get('driver/history')
  async getDriverPaymentHistory(
    @CurrentUser('sub') userId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.paymentsService.getDriverPaymentHistory(userId, limit || 20);
  }

  /**
   * Add funds to driver wallet (testing)
   * POST /api/payments/driver/wallet/add
   */
  @Post('driver/wallet/add')
  @HttpCode(HttpStatus.OK)
  async addDriverWalletFunds(
    @CurrentUser('sub') userId: string,
    @Body('amount') amount: number,
  ) {
    return this.paymentsService.addDriverWalletFunds(userId, amount);
  }

  /**
   * Request payout (driver)
   * POST /api/payments/driver/payout
   */
  @Post('driver/payout')
  @HttpCode(HttpStatus.OK)
  async requestPayout(
    @CurrentUser('sub') userId: string,
    @Body('amount') amount: number,
  ) {
    return this.paymentsService.requestPayout(userId, amount);
  }
}
