import { Module } from '@nestjs/common';
import { TripsController } from './controllers/trips.controller';
import { TripsService } from './services/trips.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [TripsController],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}
