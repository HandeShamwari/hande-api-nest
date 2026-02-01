import { Module } from '@nestjs/common';
import { TripsController } from './controllers/trips.controller';
import { BidsController } from './controllers/bids.controller';
import { TripsService } from './services/trips.service';
import { BidsService } from './services/bids.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [TripsController, BidsController],
  providers: [TripsService, BidsService],
  exports: [TripsService, BidsService],
})
export class TripsModule {}
