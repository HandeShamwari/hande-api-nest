import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import {
  AddPaymentMethodDto,
  ProcessPaymentDto,
  AddWalletFundsDto,
  PaymentMethodType,
  PaymentStatus,
} from '../dto/payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get rider's wallet balance
   */
  async getWalletBalance(userId: string) {
    const rider = await this.prisma.rider.findUnique({
      where: { userId },
    });

    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    // Get last payment
    const lastPayment = await this.prisma.payment.findFirst({
      where: { riderId: rider.id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      balance: 0, // Wallet balance would come from a wallet table
      currency: 'USD',
      lastTransaction: lastPayment
        ? {
            type: lastPayment.paymentMethod,
            amount: Number(lastPayment.amount),
            date: lastPayment.createdAt,
          }
        : null,
    };
  }

  /**
   * Process payment for a trip (rider)
   */
  async processPayment(userId: string, dto: ProcessPaymentDto) {
    const rider = await this.prisma.rider.findUnique({
      where: { userId },
    });

    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    const trip = await this.prisma.trip.findUnique({
      where: { id: dto.tripId },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.riderId !== rider.id) {
      throw new BadRequestException('Trip does not belong to this rider');
    }

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        riderId: rider.id,
        tripId: dto.tripId,
        amount: dto.amount,
        paymentMethod: dto.paymentMethodId ? 'card' : 'cash',
        status: PaymentStatus.COMPLETED,
        processedAt: new Date(),
        transactionId: `TXN-${Date.now()}`,
      },
    });

    // Update trip payment status
    await this.prisma.trip.update({
      where: { id: dto.tripId },
      data: {
        finalFare: dto.amount,
        paymentMethod: dto.paymentMethodId ? 'card' : 'cash',
      },
    });

    this.logger.log(`Payment processed: ${payment.id} for trip ${dto.tripId}`);

    return {
      id: payment.id,
      tripId: dto.tripId,
      amount: Number(payment.amount),
      status: payment.status,
      transactionId: payment.transactionId,
      processedAt: payment.processedAt,
    };
  }

  /**
   * Get rider's payment history
   */
  async getPaymentHistory(userId: string, limit: number = 20) {
    const rider = await this.prisma.rider.findUnique({
      where: { userId },
    });

    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    const payments = await this.prisma.payment.findMany({
      where: { riderId: rider.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return payments.map((p) => ({
      id: p.id,
      tripId: p.tripId,
      amount: Number(p.amount),
      paymentMethod: p.paymentMethod,
      status: p.status,
      transactionId: p.transactionId,
      processedAt: p.processedAt,
      createdAt: p.createdAt,
    }));
  }

  /**
   * Get driver's payment history (payouts)
   */
  async getDriverPaymentHistory(userId: string, limit: number = 20) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const payments = await this.prisma.driverPayment.findMany({
      where: { driverId: driver.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return payments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      paymentMethod: p.paymentMethod,
      status: p.status,
      transactionId: p.transactionId,
      processedAt: p.processedAt,
      createdAt: p.createdAt,
    }));
  }

  /**
   * Get driver's wallet balance
   */
  async getDriverWalletBalance(userId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    return {
      balance: Number(driver.walletBalance || 0),
      currency: 'USD',
      totalEarnings: Number(driver.totalEarnings || 0),
    };
  }

  /**
   * Add funds to driver wallet (for testing/seeding)
   */
  async addDriverWalletFunds(userId: string, amount: number) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const newBalance = Number(driver.walletBalance || 0) + amount;

    await this.prisma.driver.update({
      where: { id: driver.id },
      data: { walletBalance: newBalance },
    });

    // Create earning record
    await this.prisma.driverEarning.create({
      data: {
        driverId: driver.id,
        amount,
        type: 'wallet_topup',
        description: 'Wallet top-up',
      },
    });

    this.logger.log(`Added $${amount} to driver ${driver.id} wallet`);

    return {
      success: true,
      newBalance,
      message: `Added $${amount} to wallet`,
    };
  }

  /**
   * Request payout (driver)
   */
  async requestPayout(userId: string, amount: number) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    if (Number(driver.walletBalance) < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    // Deduct from wallet
    const newBalance = Number(driver.walletBalance) - amount;

    await this.prisma.driver.update({
      where: { id: driver.id },
      data: { walletBalance: newBalance },
    });

    // Create payout record
    const payout = await this.prisma.driverPayment.create({
      data: {
        driverId: driver.id,
        amount,
        paymentMethod: 'bank_transfer',
        status: 'pending',
        transactionId: `PAYOUT-${Date.now()}`,
      },
    });

    this.logger.log(`Payout requested: ${payout.id} for driver ${driver.id}`);

    return {
      id: payout.id,
      amount,
      status: 'pending',
      newBalance,
      message: 'Payout request submitted. Processing within 24-48 hours.',
    };
  }
}
