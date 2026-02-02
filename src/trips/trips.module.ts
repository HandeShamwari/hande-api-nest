import { Module, forwardRef } from '@nestjs/common';
import { TripsController } from './controllers/trips.controller';
import { BidsController } from './controllers/bids.controller';
import { TripsService } from './services/trips.service';
import { BidsService } from './services/bids.service';
import { SharedModule } from '../shared/shared.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [SharedModule, forwardRef(() => JobsModule)],
  controllers: [TripsController, BidsController],
  providers: [TripsService, BidsService],
  exports: [TripsService, BidsService],
})
export class TripsModule {}
