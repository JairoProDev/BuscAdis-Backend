import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationResponseDto,
  NotificationPreferencesDto,
} from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {
    // Clean up expired notifications periodically
    setInterval(() => this.cleanupExpiredNotifications(), 24 * 60 * 60 * 1000); // Run daily
  }

  async create(
    createNotificationDto: CreateNotificationDto,
    user: User,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      user,
    });

    return this.notificationRepository.save(notification);
  }

  async findAll(user: User): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: {
        user: { id: user.id },
        isActive: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findUnread(user: User): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: {
        user: { id: user.id },
        isActive: true,
        isRead: false,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user: User): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.user.id !== user.id) {
      throw new ForbiddenException('You can only access your own notifications');
    }

    return notification;
  }

  async update(
    id: string,
    updateNotificationDto: UpdateNotificationDto,
    user: User,
  ): Promise<Notification> {
    const notification = await this.findOne(id, user);

    if (updateNotificationDto.isRead && !notification.readAt) {
      notification.readAt = new Date();
    }

    Object.assign(notification, updateNotificationDto);

    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(user: User): Promise<void> {
    const now = new Date();
    await this.notificationRepository.update(
      {
        user: { id: user.id },
        isRead: false,
        isActive: true,
      },
      {
        isRead: true,
        readAt: now,
      },
    );
  }

  async remove(id: string, user: User): Promise<void> {
    const notification = await this.findOne(id, user);
    await this.notificationRepository.remove(notification);
  }

  async removeAll(user: User): Promise<void> {
    await this.notificationRepository.delete({
      user: { id: user.id },
    });
  }

  private async cleanupExpiredNotifications(): Promise<void> {
    const now = new Date();
    await this.notificationRepository.delete({
      expiresAt: LessThan(now),
    });
  }

  // Helper methods for creating specific types of notifications
  async notifyNewMessage(user: User, messageData: any): Promise<Notification> {
    return this.create(
      {
        type: NotificationType.NEW_MESSAGE,
        title: 'New Message',
        message: `You have a new message from ${messageData.senderName}`,
        data: messageData,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      user,
    );
  }

  async notifyNewFavorite(user: User, favoriteData: any): Promise<Notification> {
    return this.create(
      {
        type: NotificationType.NEW_FAVORITE,
        title: 'New Favorite',
        message: `Someone added your listing "${favoriteData.listingTitle}" to their favorites`,
        data: favoriteData,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      user,
    );
  }

  async notifyListingReport(user: User, reportData: any): Promise<Notification> {
    return this.create(
      {
        type: NotificationType.LISTING_REPORT,
        title: 'Listing Reported',
        message: `Your listing "${reportData.listingTitle}" has been reported`,
        data: reportData,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      user,
    );
  }

  async notifyListingStatus(
    user: User,
    listingData: any,
  ): Promise<Notification> {
    return this.create(
      {
        type: NotificationType.LISTING_STATUS,
        title: 'Listing Status Updated',
        message: `Your listing "${listingData.title}" status has been updated to ${listingData.status}`,
        data: listingData,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      user,
    );
  }

  async notifyListingExpiring(user: User, listingData: any): Promise<Notification> {
    return this.create(
      {
        type: NotificationType.LISTING_EXPIRING,
        title: 'Listing Expiring Soon',
        message: `Your listing "${listingData.title}" will expire in ${listingData.daysRemaining} days`,
        data: listingData,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      user,
    );
  }

  async notifyListingViews(user: User, listingData: any): Promise<Notification> {
    return this.create(
      {
        type: NotificationType.LISTING_VIEWS,
        title: 'Listing Performance Update',
        message: `Your listing "${listingData.title}" has reached ${listingData.views} views`,
        data: listingData,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      user,
    );
  }

  private mapToResponseDto(notification: Notification): NotificationResponseDto {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      isRead: notification.isRead,
      isActive: notification.isActive,
      createdAt: notification.createdAt,
      readAt: notification.readAt,
      expiresAt: notification.expiresAt,
    };
  }
} 