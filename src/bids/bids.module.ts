import { Module } from '@nestjs/common';
import { BidsController } from './controllers/bids.controller';
import { BidsService } from './services/bids.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [BidsController],
  providers: [BidsService],
  exports: [BidsService],
})
export class BidsModule {}
