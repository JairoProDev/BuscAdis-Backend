// src/modules/notifications/notifications.service.ts
import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
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
import { Publication } from '../publications/entities/publication.entity';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

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
            user: { id: message.publication.seller.id }, // User ID of the publication's seller
            type: NotificationType.MESSAGE, // Use the correct enum value
            title: 'Nuevo mensaje',
            message: `Has recibido un nuevo mensaje de ${message.sender.firstName}`,
            data: {
                messageId: message.id,
                senderId: message.sender.id,
                publicationId: message.publication.id,
            },
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });
        return this.notificationRepository.save(notification);
    }


    async createNewFavoriteNotification(favorite: Favorite): Promise<Notification> {
        const notification = this.notificationRepository.create({
            user: { id: favorite.publication.seller.id }, // User ID of the publication's seller
            type: NotificationType.FAVORITE, // Use the correct enum
            title: 'Nuevo favorito',
            message: `${favorite.user.firstName} ha marcado tu anuncio como favorito`,
            data: {
                favoriteId: favorite.id,
                userId: favorite.user.id,
                publicationId: favorite.publication.id,
            },
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });

        return this.notificationRepository.save(notification);
    }

    async notifyPublicationReport(userId: string, reportData: any): Promise<Notification> {
        const notification = this.notificationRepository.create({
            user: { id: userId },  // User ID
            type: NotificationType.REPORT_UPDATE, // Use correct enum value
            title: 'Publication Reported',
            message: `Your publication "${reportData.publicationTitle}" has been reported`,
            data: reportData,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
        return this.notificationRepository.save(notification);
    }

    async notifyPublicationStatus(userId: string, publicationData: any): Promise<Notification> { // userId
        const notification = this.notificationRepository.create({
            user: { id: userId },  // User ID
            type: NotificationType.PUBLICATION_UPDATE,  //Use correct enum value
            title: 'Publication Status Updated',
            message: `Your publication "${publicationData.title}" status has been updated to ${publicationData.status}`,
            data: publicationData,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
        return this.notificationRepository.save(notification);
    }

    async notifyPublicationExpiring(userId: string, publicationData: any): Promise<Notification> { // userId
        const notification = this.notificationRepository.create({
            user: { id: userId },  // User ID
            type: NotificationType.PUBLICATION_EXPIRED, //Use correct enum value
            title: 'Publication Expiring Soon',
            message: `Your publication "${publicationData.title}" will expire in ${publicationData.daysRemaining} days`,
            data: publicationData,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        return this.notificationRepository.save(notification);
    }

    async notifyPublicationViews(userId: string, publicationData: any): Promise<Notification> { // userId
      const notification = this.notificationRepository.create({
          user: { id: userId },  // User ID
          type: NotificationType.PUBLICATION_UPDATE, //Use correct enum value
          title: 'Publication Performance Update',
          message: `Your publication "${publicationData.title}" has reached ${publicationData.views} views`,
          data: publicationData,
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