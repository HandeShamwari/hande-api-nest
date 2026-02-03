import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_FOR_USER = 'waiting_for_user',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum TicketCategory {
  PAYMENT = 'payment',
  TRIP = 'trip',
  ACCOUNT = 'account',
  VEHICLE = 'vehicle',
  SUBSCRIPTION = 'subscription',
  TECHNICAL = 'technical',
  OTHER = 'other',
}

export class CreateSupportTicketDto {
  @IsString()
  subject: string;

  @IsString()
  description: string;

  @IsEnum(TicketCategory)
  @IsOptional()
  category?: TicketCategory;

  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @IsUUID()
  @IsOptional()
  tripId?: string;
}

export class UpdateSupportTicketDto {
  @IsString()
  @IsOptional()
  description?: string;
}

export class AddTicketReplyDto {
  @IsString()
  message: string;
}

export class TicketResponseDto {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category?: string;
  tripId?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}
