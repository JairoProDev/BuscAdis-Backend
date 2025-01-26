import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from 'typeorm';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { User } from '../entities/user.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  constructor(
    dataSource: DataSource,
    private readonly elasticsearchService: ElasticsearchService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return User;
  }

  private async indexUser(user: User) {
    await this.elasticsearchService.index({
      index: 'users',
      id: user.id,
      body: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  }

  async afterInsert(event: InsertEvent<User>) {
    await this.indexUser(event.entity);
  }

  async afterUpdate(event: UpdateEvent<User>) {
    if (event.entity) {
      await this.indexUser(event.entity);
    }
  }

  async beforeRemove(event: RemoveEvent<User>) {
    if (event.entityId) {
      await this.elasticsearchService.delete({
        index: 'users',
        id: event.entityId as string,
      });
    }
  }
} 