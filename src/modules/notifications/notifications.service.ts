import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationResponseDto,
  // NotificationPreferencesDto,  // Quitado, no se usa
} from './dto/notification.dto';
import { Message } from '../messages/entities/message.entity';
import { Favorite } from '../favorites/entities/favorite.entity';

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
        userId: string, // Recibe el ID del usuario, no el objeto User
    ): Promise<Notification> {

        const notification = this.notificationRepository.create({
          ...createNotificationDto,
          user: { id: userId }, //  un objeto con la propiedad 'id'
        });

        return this.notificationRepository.save(notification);
    }

  async findAll(user: User): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: {
        user: { id: user.id },  //  consulta por ID de usuario
        isActive: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findUnread(user: User): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: {
        user: { id: user.id }, //  consulta por ID
        isActive: true,
        isRead: false,
      },
      order: { createdAt: 'DESC' },
    });
  }

    async findOne(id: string, user: User): Promise<Notification> {
        const notification = await this.notificationRepository.findOne({
        where: { id, user: { id: user.id } }, //  ID de usuario
        });

        if (!notification) {
        throw new NotFoundException('Notification not found');
        }

        // Esta comprobación ya no es necesaria si filtras por user en el where
        // if (notification.user.id !== user.id) {
        //   throw new ForbiddenException('You can only access your own notifications');
        // }

        return notification;
    }

  async update(
    id: string,
    updateNotificationDto: UpdateNotificationDto,
    user: User,
  ): Promise<Notification> {
    const notification = await this.findOne(id, user); // Ya verifica el usuario

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
        user: { id: user.id },  //  ID de usuario
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
    const notification = await this.findOne(id, user); // Ya verifica el usuario
    await this.notificationRepository.remove(notification);
  }

  async removeAll(user: User): Promise<void> {
    await this.notificationRepository.delete({
      user: { id: user.id }, //  ID de usuario
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
          user: { id: message.receiver.id }, //  ID del usuario
          type: NotificationType.MESSAGE,    //  enum
          title: 'Nuevo mensaje',
          message: `Has recibido un nuevo mensaje de ${message.sender.firstName}`, //  message
          data: {
              messageId: message.id,
              senderId: message.sender.id,
              listingId: message.listing.id,
          },
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });
    return this.notificationRepository.save(notification); //  save directo
  }


    async createNewFavoriteNotification(favorite: Favorite): Promise<Notification> {
        const notification = this.notificationRepository.create({
            user: { id: favorite.listing.seller.id }, //  ID del usuario
            type: NotificationType.FAVORITE,  //  enum
            title: 'Nuevo favorito',
            message: `${favorite.user.firstName} ha marcado tu anuncio como favorito`, //  message
            data: {
                favoriteId: favorite.id,
                userId: favorite.user.id,
                listingId: favorite.listing.id,
            },
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });

      return this.notificationRepository.save(notification); //  save directo
    }

    // Los otros métodos (notifyListingReport, notifyListingStatus, etc.)
    // deben seguir el mismo patrón:  recibir el ID del usuario, usar el enum NotificationType,
    // y usar this.notificationRepository.create y .save directamente.

  async notifyListingReport(userId: string, reportData: any): Promise<Notification> { //  userId
    const notification = this.notificationRepository.create({
        user: {id: userId},
        type: NotificationType.LISTING_REPORT,
        title: 'Listing Reported',
        message: `Your listing "${reportData.listingTitle}" has been reported`,
        data: reportData,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    return this.notificationRepository.save(notification);
  }

    async notifyListingStatus(userId: string, listingData: any): Promise<Notification> { //  userId
        const notification = this.notificationRepository.create({
            user: {id: userId},
            type: NotificationType.LISTING_STATUS,
            title: 'Listing Status Updated',
            message: `Your listing "${listingData.title}" status has been updated to ${listingData.status}`,
            data: listingData,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
    return this.notificationRepository.save(notification);
  }


    async notifyListingExpiring(userId: string, listingData: any): Promise<Notification> { // userId
        const notification = this.notificationRepository.create({
            user: { id: userId },
            type: NotificationType.LISTING_EXPIRING,
            title: 'Listing Expiring Soon',
            message: `Your listing "${listingData.title}" will expire in ${listingData.daysRemaining} days`,
            data: listingData,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        return this.notificationRepository.save(notification);
    }


    async notifyListingViews(userId: string, listingData: any): Promise<Notification> { //  userId
        const notification = this.notificationRepository.create({
          user: { id: userId },
          type: NotificationType.LISTING_VIEWS,
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