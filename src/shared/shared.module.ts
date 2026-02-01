import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { SupabaseService } from './services/supabase.service';
import { UploadController } from './controllers/upload.controller';

@Global()
@Module({
  providers: [PrismaService, SupabaseService],
  controllers: [UploadController],
  exports: [PrismaService, SupabaseService],
})
export class SharedModule {}
