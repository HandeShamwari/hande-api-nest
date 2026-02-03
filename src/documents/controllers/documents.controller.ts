import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { DocumentsService } from '../services/documents.service';
import { UploadDocumentDto, UpdateDocumentDto } from '../dto/document.dto';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * Upload a document
   * POST /api/documents
   */
  @Post()
  async uploadDocument(
    @CurrentUser('sub') userId: string,
    @Body() dto: UploadDocumentDto,
  ) {
    return this.documentsService.uploadDocument(userId, dto);
  }

  /**
   * Get all my documents
   * GET /api/documents
   */
  @Get()
  async getMyDocuments(@CurrentUser('sub') userId: string) {
    return this.documentsService.getMyDocuments(userId);
  }

  /**
   * Get document status summary
   * GET /api/documents/status
   */
  @Get('status')
  async getDocumentStatus(@CurrentUser('sub') userId: string) {
    return this.documentsService.getDocumentStatus(userId);
  }

  /**
   * Get document by ID
   * GET /api/documents/:id
   */
  @Get(':id')
  async getDocument(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) documentId: string,
  ) {
    return this.documentsService.getDocument(userId, documentId);
  }

  /**
   * Update document
   * PUT /api/documents/:id
   */
  @Put(':id')
  async updateDocument(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) documentId: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documentsService.updateDocument(userId, documentId, dto);
  }

  /**
   * Delete document
   * DELETE /api/documents/:id
   */
  @Delete(':id')
  async deleteDocument(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) documentId: string,
  ) {
    return this.documentsService.deleteDocument(userId, documentId);
  }
}
