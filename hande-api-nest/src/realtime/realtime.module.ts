import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { SupabaseService } from '../shared/services/supabase.service';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'hande-ride-service-jwt-secret-2026',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [SupabaseService, RealtimeGateway],
  exports: [SupabaseService, RealtimeGateway],
})
export class RealtimeModule {}
