import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { UploadDocumentDto, UpdateDocumentDto, DocumentType } from '../dto/document.dto';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Upload a document
   */
  async uploadDocument(userId: string, dto: UploadDocumentDto) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    // Check if document type already exists
    const existing = await this.prisma.driverDocument.findFirst({
      where: {
        driverId: driver.id,
        documentType: dto.documentType,
      },
    });

    if (existing) {
      // Update existing document
      const updated = await this.prisma.driverDocument.update({
        where: { id: existing.id },
        data: {
          documentUrl: dto.documentUrl,
          documentNumber: dto.documentNumber,
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
          verifiedAt: null, // Reset verification when re-uploading
        },
      });

      this.logger.log(`Document updated: ${updated.id} (${dto.documentType})`);

      return this.formatDocument(updated);
    }

    // Create new document
    const document = await this.prisma.driverDocument.create({
      data: {
        driverId: driver.id,
        documentType: dto.documentType,
        documentUrl: dto.documentUrl,
        documentNumber: dto.documentNumber,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      },
    });

    this.logger.log(`Document uploaded: ${document.id} (${dto.documentType})`);

    return this.formatDocument(document);
  }

  /**
   * Get all my documents
   */
  async getMyDocuments(userId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const documents = await this.prisma.driverDocument.findMany({
      where: { driverId: driver.id },
      orderBy: { uploadedAt: 'desc' },
    });

    return documents.map(this.formatDocument);
  }

  /**
   * Get document by ID
   */
  async getDocument(userId: string, documentId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const document = await this.prisma.driverDocument.findFirst({
      where: {
        id: documentId,
        driverId: driver.id,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return this.formatDocument(document);
  }

  /**
   * Update document
   */
  async updateDocument(userId: string, documentId: string, dto: UpdateDocumentDto) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const document = await this.prisma.driverDocument.findFirst({
      where: {
        id: documentId,
        driverId: driver.id,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const updated = await this.prisma.driverDocument.update({
      where: { id: documentId },
      data: {
        ...(dto.documentUrl && { documentUrl: dto.documentUrl }),
        ...(dto.documentNumber && { documentNumber: dto.documentNumber }),
        ...(dto.expiryDate && { expiryDate: new Date(dto.expiryDate) }),
        verifiedAt: null, // Reset verification when updating
      },
    });

    return this.formatDocument(updated);
  }

  /**
   * Delete document
   */
  async deleteDocument(userId: string, documentId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const document = await this.prisma.driverDocument.findFirst({
      where: {
        id: documentId,
        driverId: driver.id,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    await this.prisma.driverDocument.delete({
      where: { id: documentId },
    });

    return { success: true, message: 'Document deleted' };
  }

  /**
   * Get document status summary
   */
  async getDocumentStatus(userId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const documents = await this.prisma.driverDocument.findMany({
      where: { driverId: driver.id },
    });

    const requiredTypes = [DocumentType.LICENSE, DocumentType.INSURANCE];
    const uploadedTypes = documents.map((d) => d.documentType);

    const missing = requiredTypes.filter((t) => !uploadedTypes.includes(t));
    const pending = documents.filter((d) => !d.verifiedAt);
    const verified = documents.filter((d) => d.verifiedAt);
    const expiring = documents.filter((d) => {
      if (!d.expiryDate) return false;
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      return new Date(d.expiryDate).getTime() - Date.now() < thirtyDays;
    });

    return {
      total: documents.length,
      verified: verified.length,
      pending: pending.length,
      expiringSoon: expiring.length,
      missingRequired: missing,
      isComplete: missing.length === 0 && pending.length === 0,
    };
  }

  private formatDocument(doc: any) {
    const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
    
    return {
      id: doc.id,
      documentType: doc.documentType,
      documentUrl: doc.documentUrl,
      documentNumber: doc.documentNumber,
      expiryDate: doc.expiryDate,
      status: doc.verifiedAt
        ? isExpired
          ? 'expired'
          : 'approved'
        : 'pending',
      verifiedAt: doc.verifiedAt,
      uploadedAt: doc.uploadedAt,
      createdAt: doc.createdAt,
    };
  }
}
