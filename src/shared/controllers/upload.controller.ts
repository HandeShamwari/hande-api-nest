import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SupabaseService } from '../services/supabase.service';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Upload driver license image
   * POST /api/upload/license
   */
  @Post('license')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLicense(
    @CurrentUser('sub') userId: string,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only images and PDFs are allowed');
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 5MB');
    }

    const fileName = `licenses/${userId}-${Date.now()}-${file.originalname}`;
    const url = await this.supabaseService.uploadFile(
      'driver-documents',
      fileName,
      file.buffer,
      file.mimetype,
    );

    return {
      message: 'License uploaded successfully',
      url,
    };
  }

  /**
   * Upload vehicle image
   * POST /api/upload/vehicle
   */
  @Post('vehicle')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVehicleImage(
    @CurrentUser('sub') userId: string,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type (images only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only images are allowed');
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 5MB');
    }

    const fileName = `vehicles/${userId}-${Date.now()}-${file.originalname}`;
    const url = await this.supabaseService.uploadFile(
      'vehicle-images',
      fileName,
      file.buffer,
      file.mimetype,
    );

    return {
      message: 'Vehicle image uploaded successfully',
      url,
    };
  }

  /**
   * Upload profile image
   * POST /api/upload/profile
   */
  @Post('profile')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(
    @CurrentUser('sub') userId: string,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type (images only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only images are allowed');
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 2MB');
    }

    const fileName = `profiles/${userId}-${Date.now()}-${file.originalname}`;
    const url = await this.supabaseService.uploadFile(
      'profile-images',
      fileName,
      file.buffer,
      file.mimetype,
    );

    return {
      message: 'Profile image uploaded successfully',
      url,
    };
  }
}
