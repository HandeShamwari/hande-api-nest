import { Module } from '@nestjs/common';
import { DriversController } from './controllers/drivers.controller';
import { VehiclesController } from './controllers/vehicles.controller';
import { DriversService } from './services/drivers.service';
import { VehiclesService } from './services/vehicles.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [DriversController, VehiclesController],
  providers: [DriversService, VehiclesService],
  exports: [DriversService, VehiclesService],
})
export class DriversModule {}
