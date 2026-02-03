import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RidersService } from '../services/riders.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { 
  UpdateRiderProfileDto,
  CreateSavedLocationDto,
  UpdateSavedLocationDto,
  CreateEmergencyContactDto,
  UpdateEmergencyContactDto,
  UpdateRiderLocationDto,
} from '../dto/rider.dto';

@Controller('riders')
@UseGuards(JwtAuthGuard)
export class RidersController {
  constructor(private readonly ridersService: RidersService) {}

  /**
   * GET /api/riders/profile
   * Get rider profile
   */
  @Get('profile')
  async getProfile(@CurrentUser('sub') userId: string) {
    return this.ridersService.getProfile(userId);
  }

  /**
   * PUT /api/riders/profile
   * Update rider profile
   */
  @Put('profile')
  async updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateRiderProfileDto,
  ) {
    return this.ridersService.updateProfile(userId, dto);
  }

  /**
   * PUT /api/riders/location
   * Update rider location
   */
  @Put('location')
  async updateLocation(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateRiderLocationDto,
  ) {
    return this.ridersService.updateLocation(userId, dto);
  }

  /**
   * GET /api/riders/stats
   * Get rider statistics
   */
  @Get('stats')
  async getStats(@CurrentUser('sub') userId: string) {
    return this.ridersService.getStats(userId);
  }

  /**
   * GET /api/riders/trips
   * Get recent trips
   */
  @Get('trips')
  async getRecentTrips(
    @CurrentUser('sub') userId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.ridersService.getRecentTrips(userId, limit);
  }

  // ============================================================================
  // SAVED LOCATIONS
  // ============================================================================

  /**
   * GET /api/riders/locations
   * Get all saved locations
   */
  @Get('locations')
  async getSavedLocations(@CurrentUser('sub') userId: string) {
    return this.ridersService.getSavedLocations(userId);
  }

  /**
   * POST /api/riders/locations
   * Create saved location
   */
  @Post('locations')
  async createSavedLocation(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateSavedLocationDto,
  ) {
    return this.ridersService.createSavedLocation(userId, dto);
  }

  /**
   * PUT /api/riders/locations/:id
   * Update saved location
   */
  @Put('locations/:id')
  async updateSavedLocation(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) locationId: string,
    @Body() dto: UpdateSavedLocationDto,
  ) {
    return this.ridersService.updateSavedLocation(userId, locationId, dto);
  }

  /**
   * DELETE /api/riders/locations/:id
   * Delete saved location
   */
  @Delete('locations/:id')
  async deleteSavedLocation(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) locationId: string,
  ) {
    return this.ridersService.deleteSavedLocation(userId, locationId);
  }

  // ============================================================================
  // EMERGENCY CONTACTS
  // ============================================================================

  /**
   * GET /api/riders/emergency-contacts
   * Get all emergency contacts
   */
  @Get('emergency-contacts')
  async getEmergencyContacts(@CurrentUser('sub') userId: string) {
    return this.ridersService.getEmergencyContacts(userId);
  }

  /**
   * POST /api/riders/emergency-contacts
   * Create emergency contact
   */
  @Post('emergency-contacts')
  async createEmergencyContact(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateEmergencyContactDto,
  ) {
    return this.ridersService.createEmergencyContact(userId, dto);
  }

  /**
   * PUT /api/riders/emergency-contacts/:id
   * Update emergency contact
   */
  @Put('emergency-contacts/:id')
  async updateEmergencyContact(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) contactId: string,
    @Body() dto: UpdateEmergencyContactDto,
  ) {
    return this.ridersService.updateEmergencyContact(userId, contactId, dto);
  }

  /**
   * DELETE /api/riders/emergency-contacts/:id
   * Delete emergency contact
   */
  @Delete('emergency-contacts/:id')
  async deleteEmergencyContact(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) contactId: string,
  ) {
    return this.ridersService.deleteEmergencyContact(userId, contactId);
  }
}
