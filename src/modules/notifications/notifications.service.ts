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
import { Classifiedad } from '../classifiedads/entities/classifiedad.entity';

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
            user: { id: message.classifiedad.seller.id }, // User ID of the classifiedad's seller
            type: NotificationType.MESSAGE, // Use the correct enum value
            title: 'Nuevo mensaje',
            message: `Has recibido un nuevo mensaje de ${message.sender.firstName}`,
            data: {
                messageId: message.id,
                senderId: message.sender.id,
                classifiedadId: message.classifiedad.id,
            },
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });
        return this.notificationRepository.save(notification);
    }


    async createNewFavoriteNotification(favorite: Favorite): Promise<Notification> {
        const notification = this.notificationRepository.create({
            user: { id: favorite.classifiedad.seller.id }, // User ID of the classifiedad's seller
            type: NotificationType.FAVORITE, // Use the correct enum
            title: 'Nuevo favorito',
            message: `${favorite.user.firstName} ha marcado tu anuncio como favorito`,
            data: {
                favoriteId: favorite.id,
                userId: favorite.user.id,
                classifiedadId: favorite.classifiedad.id,
            },
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });

        return this.notificationRepository.save(notification);
    }

    async notifyClassifiedadReport(userId: string, reportData: any): Promise<Notification> {
        const notification = this.notificationRepository.create({
            user: { id: userId },  // User ID
            type: NotificationType.REPORT_UPDATE, // Use correct enum value
            title: 'Classifiedad Reported',
            message: `Your classifiedad "${reportData.classifiedadTitle}" has been reported`,
            data: reportData,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
        return this.notificationRepository.save(notification);
    }

    async notifyClassifiedadStatus(userId: string, classifiedadData: any): Promise<Notification> { // userId
        const notification = this.notificationRepository.create({
            user: { id: userId },  // User ID
            type: NotificationType.CLASSIFIEDAD_UPDATE,  //Use correct enum value
            title: 'Classifiedad Status Updated',
            message: `Your classifiedad "${classifiedadData.title}" status has been updated to ${classifiedadData.status}`,
            data: classifiedadData,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
        return this.notificationRepository.save(notification);
    }

    async notifyClassifiedadExpiring(userId: string, classifiedadData: any): Promise<Notification> { // userId
        const notification = this.notificationRepository.create({
            user: { id: userId },  // User ID
            type: NotificationType.CLASSIFIEDAD_EXPIRED, //Use correct enum value
            title: 'Classifiedad Expiring Soon',
            message: `Your classifiedad "${classifiedadData.title}" will expire in ${classifiedadData.daysRemaining} days`,
            data: classifiedadData,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        return this.notificationRepository.save(notification);
    }

    async notifyClassifiedadViews(userId: string, classifiedadData: any): Promise<Notification> { // userId
      const notification = this.notificationRepository.create({
          user: { id: userId },  // User ID
          type: NotificationType.CLASSIFIEDAD_UPDATE, //Use correct enum value
          title: 'Classifiedad Performance Update',
          message: `Your classifiedad "${classifiedadData.title}" has reached ${classifiedadData.views} views`,
          data: classifiedadData,
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