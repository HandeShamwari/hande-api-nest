import { IsString, IsOptional, IsEnum, IsObject, IsBoolean } from 'class-validator';

export enum NotificationType {
  TRIP_REQUEST = 'trip_request',
  TRIP_ACCEPTED = 'trip_accepted',
  TRIP_CANCELLED = 'trip_cancelled',
  TRIP_COMPLETED = 'trip_completed',
  DRIVER_ARRIVING = 'driver_arriving',
  DRIVER_ARRIVED = 'driver_arrived',
  PAYMENT = 'payment',
  SUBSCRIPTION = 'subscription',
  PROMOTION = 'promotion',
  SYSTEM = 'system',
  RATING_REMINDER = 'rating_reminder',
}

export class RegisterPushTokenDto {
  @IsString()
  token: string;

  @IsEnum(['android', 'ios', 'web'])
  @IsOptional()
  platform?: string;
}

export class SendNotificationDto {
  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsObject()
  @IsOptional()
  data?: Record<string, string>;
}

export class NotificationPreferencesDto {
  @IsBoolean()
  @IsOptional()
  tripUpdates?: boolean;

  @IsBoolean()
  @IsOptional()
  promotions?: boolean;

  @IsBoolean()
  @IsOptional()
  payments?: boolean;

  @IsBoolean()
  @IsOptional()
  subscriptionReminders?: boolean;

  @IsBoolean()
  @IsOptional()
  ratingReminders?: boolean;
}

export class NotificationResponseDto {
  id: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, any>;
  readAt?: Date;
  sentAt: Date;
  createdAt: Date;
}
