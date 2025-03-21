import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { Message } from './entities/message.entity';
import { User } from '../users/entities/user.entity';
import { Publication } from '../publications/entities/publication.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { PublicationsModule } from '../publications/publications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, User, Publication]),
    NotificationsModule,
    PublicationsModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {} 
