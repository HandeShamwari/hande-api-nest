import { Module } from '@nestjs/common';
import { RidersController } from './controllers/riders.controller';
import { RidersService } from './services/riders.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [RidersController],
  providers: [RidersService],
  exports: [RidersService],
})
export class RidersModule {}
