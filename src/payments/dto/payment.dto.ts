import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsUUID } from 'class-validator';

export enum PaymentMethodType {
  CARD = 'card',
  MOBILE_MONEY = 'mobile_money',
  CASH = 'cash',
  WALLET = 'wallet',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export class AddPaymentMethodDto {
  @IsEnum(PaymentMethodType)
  type: PaymentMethodType;

  @IsString()
  @IsOptional()
  cardNumber?: string; // Last 4 digits only for display

  @IsString()
  @IsOptional()
  cardBrand?: string; // visa, mastercard, etc.

  @IsString()
  @IsOptional()
  expiryMonth?: string;

  @IsString()
  @IsOptional()
  expiryYear?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string; // For mobile money

  @IsString()
  @IsOptional()
  provider?: string; // EcoCash, OneMoney, etc.

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsString()
  @IsOptional()
  token?: string; // Payment gateway token
}

export class ProcessPaymentDto {
  @IsUUID()
  tripId: string;

  @IsUUID()
  @IsOptional()
  paymentMethodId?: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;
}

export class AddWalletFundsDto {
  @IsNumber()
  amount: number;

  @IsUUID()
  paymentMethodId: string;
}

export class PaymentMethodResponseDto {
  id: string;
  type: string;
  lastFour?: string;
  cardBrand?: string;
  phoneNumber?: string;
  provider?: string;
  isDefault: boolean;
  createdAt: Date;
}

export class WalletResponseDto {
  balance: number;
  currency: string;
  lastTransaction?: {
    type: string;
    amount: number;
    date: Date;
  };
}
