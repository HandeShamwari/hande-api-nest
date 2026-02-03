import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { FcmService, PushNotification } from './fcm.service';
import {
  RegisterPushTokenDto,
  SendNotificationDto,
  NotificationType,
} from '../dto/notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private fcmService: FcmService,
  ) {}

  /**
   * Register push notification token
   */
  async registerPushToken(userId: string, dto: RegisterPushTokenDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { pushToken: dto.token },
    });

    this.logger.log(`Push token registered for user ${userId}`);

    return { success: true, message: 'Push token registered' };
  }

  /**
   * Get driver's notifications
   */
  async getDriverNotifications(userId: string, limit: number = 50) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const notifications = await this.prisma.driverNotification.findMany({
      where: { driverId: driver.id },
      orderBy: { sentAt: 'desc' },
      take: limit,
    });

    return notifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      data: n.data,
      read: !!n.readAt,
      readAt: n.readAt,
      sentAt: n.sentAt,
    }));
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      return 0;
    }

    return this.prisma.driverNotification.count({
      where: {
        driverId: driver.id,
        readAt: null,
      },
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const notification = await this.prisma.driverNotification.findFirst({
      where: {
        id: notificationId,
        driverId: driver.id,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.driverNotification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });

    return { success: true };
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    await this.prisma.driverNotification.updateMany({
      where: {
        driverId: driver.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return { success: true };
  }

  /**
   * Delete a notification
   */
  async deleteNotification(userId: string, notificationId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    await this.prisma.driverNotification.deleteMany({
      where: {
        id: notificationId,
        driverId: driver.id,
      },
    });

    return { success: true };
  }

  /**
   * Send notification to a driver
   */
  async sendToDriver(
    driverId: string,
    notification: SendNotificationDto,
  ) {
    // Save to database
    const saved = await this.prisma.driverNotification.create({
      data: {
        driverId,
        title: notification.title,
        body: notification.body,
        type: notification.type || NotificationType.SYSTEM,
        data: notification.data as any,
        sentAt: new Date(),
      },
    });

    // Get driver's push token
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: { user: true },
    });

    if (driver?.user.pushToken) {
      await this.fcmService.sendToDevice(driver.user.pushToken, {
        title: notification.title,
        body: notification.body,
        data: {
          ...notification.data,
          notificationId: saved.id,
          type: notification.type || NotificationType.SYSTEM,
        },
      });
    }

    return saved;
  }

  /**
   * Send notification to a user by userId
   */
  async sendToUser(
    userId: string,
    notification: PushNotification & { type?: NotificationType },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(`User not found for notification: ${userId}`);
      return false;
    }

    // Save as driver notification if driver
    if (user.userType === 'driver') {
      const driver = await this.prisma.driver.findUnique({
        where: { userId },
      });

      if (driver) {
        await this.prisma.driverNotification.create({
          data: {
            driverId: driver.id,
            title: notification.title,
            body: notification.body,
            type: notification.type || NotificationType.SYSTEM,
            data: notification.data as any,
            sentAt: new Date(),
          },
        });
      }
    }

    // Send push notification
    if (user.pushToken) {
      return this.fcmService.sendToDevice(user.pushToken, notification);
    }

    return false;
  }

  /**
   * Send trip notification
   */
  async sendTripNotification(
    userId: string,
    type: NotificationType,
    tripId: string,
    message: string,
  ) {
    return this.sendToUser(userId, {
      title: this.getTitleForType(type),
      body: message,
      type,
      data: { tripId, type },
    });
  }

  /**
   * Send subscription expiry warning
   */
  async sendExpiryWarning(driverId: string, hoursRemaining: number) {
    return this.sendToDriver(driverId, {
      title: 'Subscription Expiring Soon',
      body: `Your $1 daily subscription expires in ${hoursRemaining} hours. Renew now to keep accepting rides.`,
      type: NotificationType.SUBSCRIPTION,
      data: { hoursRemaining: String(hoursRemaining) },
    });
  }

  /**
   * Send rating reminder
   */
  async sendRatingReminder(userId: string, tripId: string, driverName: string) {
    return this.sendToUser(userId, {
      title: 'Rate Your Ride',
      body: `How was your trip with ${driverName}? Tap to leave a rating.`,
      type: NotificationType.RATING_REMINDER,
      data: { tripId, type: NotificationType.RATING_REMINDER },
    });
  }

  private getTitleForType(type: NotificationType): string {
    const titles: Record<NotificationType, string> = {
      [NotificationType.TRIP_REQUEST]: 'New Trip Request',
      [NotificationType.TRIP_ACCEPTED]: 'Trip Accepted',
      [NotificationType.TRIP_CANCELLED]: 'Trip Cancelled',
      [NotificationType.TRIP_COMPLETED]: 'Trip Completed',
      [NotificationType.DRIVER_ARRIVING]: 'Driver On The Way',
      [NotificationType.DRIVER_ARRIVED]: 'Driver Arrived',
      [NotificationType.PAYMENT]: 'Payment Update',
      [NotificationType.SUBSCRIPTION]: 'Subscription Update',
      [NotificationType.PROMOTION]: 'Special Offer',
      [NotificationType.SYSTEM]: 'Hande',
      [NotificationType.RATING_REMINDER]: 'Rate Your Ride',
    };
    return titles[type] || 'Hande';
  }
}
