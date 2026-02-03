import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { NotificationsService } from '../services/notifications.service';
import { RegisterPushTokenDto } from '../dto/notification.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Register push notification token
   * POST /api/notifications/token
   */
  @Post('token')
  async registerPushToken(
    @CurrentUser('sub') userId: string,
    @Body() dto: RegisterPushTokenDto,
  ) {
    return this.notificationsService.registerPushToken(userId, dto);
  }

  /**
   * Get my notifications
   * GET /api/notifications
   */
  @Get()
  async getNotifications(
    @CurrentUser('sub') userId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.notificationsService.getDriverNotifications(userId, limit || 50);
  }

  /**
   * Get unread count
   * GET /api/notifications/unread-count
   */
  @Get('unread-count')
  async getUnreadCount(@CurrentUser('sub') userId: string) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  /**
   * Mark notification as read
   * PUT /api/notifications/:id/read
   */
  @Put(':id/read')
  async markAsRead(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) notificationId: string,
  ) {
    return this.notificationsService.markAsRead(userId, notificationId);
  }

  /**
   * Mark all notifications as read
   * PUT /api/notifications/read-all
   */
  @Put('read-all')
  async markAllAsRead(@CurrentUser('sub') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  /**
   * Delete a notification
   * DELETE /api/notifications/:id
   */
  @Delete(':id')
  async deleteNotification(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) notificationId: string,
  ) {
    return this.notificationsService.deleteNotification(userId, notificationId);
  }
}
