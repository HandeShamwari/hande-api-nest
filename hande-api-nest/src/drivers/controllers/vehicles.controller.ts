import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VehiclesService } from '../services/vehicles.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CreateVehicleDto, UpdateVehicleDto } from '../dto/vehicle.dto';

@Controller('drivers/vehicles')
@UseGuards(JwtAuthGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  /**
   * POST /api/drivers/vehicles
   * Add a new vehicle
   */
  @Post()
  async create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateVehicleDto,
  ) {
    return this.vehiclesService.create(userId, dto);
  }

  /**
   * GET /api/drivers/vehicles
   * Get all vehicles for current driver
   */
  @Get()
  async findAll(@CurrentUser('sub') userId: string) {
    return this.vehiclesService.findAll(userId);
  }

  /**
   * GET /api/drivers/vehicles/:id
   * Get a specific vehicle
   */
  @Get(':id')
  async findOne(
    @CurrentUser('sub') userId: string,
    @Param('id') vehicleId: string,
  ) {
    return this.vehiclesService.findOne(userId, vehicleId);
  }

  /**
   * PUT /api/drivers/vehicles/:id
   * Update vehicle details
   */
  @Put(':id')
  async update(
    @CurrentUser('sub') userId: string,
    @Param('id') vehicleId: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(userId, vehicleId, dto);
  }

  /**
   * DELETE /api/drivers/vehicles/:id
   * Delete a vehicle
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser('sub') userId: string,
    @Param('id') vehicleId: string,
  ) {
    return this.vehiclesService.remove(userId, vehicleId);
  }

  /**
   * POST /api/drivers/vehicles/:id/activate
   * Set vehicle as active for trips
   */
  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  async setActive(
    @CurrentUser('sub') userId: string,
    @Param('id') vehicleId: string,
  ) {
    return this.vehiclesService.setActive(userId, vehicleId);
  }
}
