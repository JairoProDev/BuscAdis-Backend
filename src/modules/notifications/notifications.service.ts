// src/modules/notifications/notifications.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import {
    CreateNotificationDto,
    UpdateNotificationDto,
    NotificationResponseDto,
    // NotificationPreferencesDto,  // Removed
} from './dto/notification.dto';
import { Message } from '../messages/entities/message.entity';
import { Favorite } from '../favorites/entities/favorite.entity';
import { Listing } from '../listings/entities/listing.entity';

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
        userId: string, // Receives user ID
    ): Promise<Notification> {

        const notification = this.notificationRepository.create({
            ...createNotificationDto,
            user: { id: userId }, // Assign user by ID
        });

        return this.notificationRepository.save(notification);
    }

    async findAll(user: User): Promise<Notification[]> {
        return this.notificationRepository.find({
            where: {
                user: { id: user.id }, // Filter by user ID
                isActive: true,
            },
            order: { createdAt: 'DESC' },
        });
    }

    async findUnread(user: User): Promise<Notification[]> {
        return this.notificationRepository.find({
            where: {
                user: { id: user.id }, // Filter by user ID
                isActive: true,
                isRead: false,
            },
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string, user: User): Promise<Notification> {
        const notification = await this.notificationRepository.findOne({
            where: { id, user: { id: user.id } }, // Filter by user ID and notification ID
        });

        if (!notification) {
            throw new NotFoundException('Notification not found');
        }
        return notification;
    }

    async update(
        id: string,
        updateNotificationDto: UpdateNotificationDto,
        user: User,
    ): Promise<Notification> {
        const notification = await this.findOne(id, user); // findOne already checks user

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
                user: { id: user.id }, // Filter by user ID
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
        const notification = await this.findOne(id, user);  // findOne already checks user
        await this.notificationRepository.remove(notification);
    }

    async removeAll(user: User): Promise<void> {
        await this.notificationRepository.delete({
            user: { id: user.id }, // Filter by user ID
        });
    }

    private async cleanupExpiredNotifications(): Promise<void> {
        const now = new Date();
        await this.notificationRepository.delete({
            expiresAt: LessThan(now),
        });
    }

    // Helper methods for creating specific types of notifications

    async createNewMessageNotification(message: Message): Promise<Notification> {
        const notification = this.notificationRepository.create({
            user: { id: message.listing.seller.id }, // User ID of the listing's seller
            type: NotificationType.MESSAGE, // Use the correct enum value
            title: 'Nuevo mensaje',
            message: `Has recibido un nuevo mensaje de ${message.sender.firstName}`,
            data: {
                messageId: message.id,
                senderId: message.sender.id,
                listingId: message.listing.id,
            },
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });
        return this.notificationRepository.save(notification);
    }


    async createNewFavoriteNotification(favorite: Favorite): Promise<Notification> {
        const notification = this.notificationRepository.create({
            user: { id: favorite.listing.seller.id }, // User ID of the listing's seller
            type: NotificationType.FAVORITE, // Use the correct enum
            title: 'Nuevo favorito',
            message: `${favorite.user.firstName} ha marcado tu anuncio como favorito`,
            data: {
                favoriteId: favorite.id,
                userId: favorite.user.id,
                listingId: favorite.listing.id,
            },
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });

        return this.notificationRepository.save(notification);
    }

    async notifyListingReport(userId: string, reportData: any): Promise<Notification> {
        const notification = this.notificationRepository.create({
            user: { id: userId },  // User ID
            type: NotificationType.REPORT_UPDATE, // Use correct enum value
            title: 'Listing Reported',
            message: `Your listing "${reportData.listingTitle}" has been reported`,
            data: reportData,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
        return this.notificationRepository.save(notification);
    }

    async notifyListingStatus(userId: string, listingData: any): Promise<Notification> { // userId
        const notification = this.notificationRepository.create({
            user: { id: userId },  // User ID
            type: NotificationType.LISTING_UPDATE,  //Use correct enum value
            title: 'Listing Status Updated',
            message: `Your listing "${listingData.title}" status has been updated to ${listingData.status}`,
            data: listingData,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
        return this.notificationRepository.save(notification);
    }

    async notifyListingExpiring(userId: string, listingData: any): Promise<Notification> { // userId
        const notification = this.notificationRepository.create({
            user: { id: userId },  // User ID
            type: NotificationType.LISTING_EXPIRED, //Use correct enum value
            title: 'Listing Expiring Soon',
            message: `Your listing "${listingData.title}" will expire in ${listingData.daysRemaining} days`,
            data: listingData,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        return this.notificationRepository.save(notification);
    }

    async notifyListingViews(userId: string, listingData: any): Promise<Notification> { // userId
      const notification = this.notificationRepository.create({
          user: { id: userId },  // User ID
          type: NotificationType.LISTING_UPDATE, //Use correct enum value
          title: 'Listing Performance Update',
          message: `Your listing "${listingData.title}" has reached ${listingData.views} views`,
          data: listingData,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      return this.notificationRepository.save(notification);
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
     async markAsRead(id: string, user: User): Promise<Notification> {
        const notification = await this.findOne(id, user); //findOne ya comprueba si la notificacion pertenece al usuario.
        notification.isRead = true;
        notification.readAt = new Date(); // Establecer la fecha de lectura
        return this.notificationRepository.save(notification);
    }
}