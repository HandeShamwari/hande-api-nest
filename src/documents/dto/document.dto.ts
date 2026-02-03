import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';

export enum DocumentType {
  LICENSE = 'license',
  INSURANCE = 'insurance',
  REGISTRATION = 'registration',
  BACKGROUND_CHECK = 'background_check',
  PROFILE_PHOTO = 'profile_photo',
  VEHICLE_PHOTO = 'vehicle_photo',
  OTHER = 'other',
}

export enum DocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export class UploadDocumentDto {
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @IsString()
  documentUrl: string;

  @IsString()
  @IsOptional()
  documentNumber?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;
}

export class UpdateDocumentDto {
  @IsString()
  @IsOptional()
  documentUrl?: string;

  @IsString()
  @IsOptional()
  documentNumber?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;
}

export class DocumentResponseDto {
  id: string;
  documentType: string;
  documentUrl: string;
  documentNumber?: string;
  expiryDate?: Date;
  status: string;
  verifiedAt?: Date;
  uploadedAt: Date;
  createdAt: Date;
}
