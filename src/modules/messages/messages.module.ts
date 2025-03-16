import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { Message } from './entities/message.entity';
import { User } from '../users/entities/user.entity';
import { Classifiedad } from '../classifiedads/entities/classifiedad.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { ClassifiedadsModule } from '../classifiedads/classifiedads.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, User, Classifiedad]),
    NotificationsModule,
    ClassifiedadsModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {} 
