// src/modules/users/subscribers/user.subscriber.ts
import {
    EventSubscriber,
    EntitySubscriberInterface,
    InsertEvent,
    UpdateEvent,
  } from 'typeorm';
  import { User } from '../entities/user.entity'; //  User
  import { UsersService } from '../users.service'; //  UsersService

  @EventSubscriber()
  export class UserSubscriber implements EntitySubscriberInterface<User> {
    constructor(private readonly usersService: UsersService) {}

    listenTo() {
      return User;
    }

    async afterInsert(event: InsertEvent<User>) {
        if (event.entity) {
            // Eliminar la llamada a indexUser
            // await this.usersService.indexUser(event.entity);
        }
    }

    async afterUpdate(event: UpdateEvent<User>) {
        if (event.entity) {
            // Eliminar la llamada a indexUser
            // await this.usersService.indexUser(event.entity as User); // Ya es de tipo User
        }
    }
  }