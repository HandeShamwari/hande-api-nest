import { Module, forwardRef } from '@nestjs/common';
import { DriversController } from './controllers/drivers.controller';
import { VehiclesController } from './controllers/vehicles.controller';
import { DriversService } from './services/drivers.service';
import { VehiclesService } from './services/vehicles.service';
import { SharedModule } from '../shared/shared.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [SharedModule, forwardRef(() => JobsModule)],
  controllers: [DriversController, VehiclesController],
  providers: [DriversService, VehiclesService],
  exports: [DriversService, VehiclesService],
})
export class DriversModule {}
