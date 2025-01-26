import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { User } from '../users/entities/user.entity';
import { Listing } from '../listings/entities/listing.entity';
import { CreateMessageDto, UpdateMessageDto } from './dto/message.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Listing)
    private readonly listingsRepository: Repository<Listing>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createMessageDto: CreateMessageDto, sender: User): Promise<Message> {
    const receiver = await this.usersRepository.findOne({
      where: { id: createMessageDto.receiverId },
    });

    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    const listing = await this.listingsRepository.findOne({
      where: { id: createMessageDto.listingId },
      relations: ['seller'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.seller.id === sender.id) {
      throw new ForbiddenException('Cannot send a message to your own listing');
    }

    const message = this.messagesRepository.create({
      sender,
      receiver,
      listing,
      content: createMessageDto.content,
    });

    await this.messagesRepository.save(message);

    // Notify the receiver
    await this.notificationsService.createNewMessageNotification(
      receiver,
      sender,
      listing,
    );

    return message;
  }

  async findAll(user: User): Promise<Message[]> {
    return this.messagesRepository.find({
      where: [
        { sender: { id: user.id } },
        { receiver: { id: user.id } },
      ],
      relations: ['sender', 'receiver', 'listing'],
      order: { createdAt: 'DESC' },
    });
  }

  async findConversation(user: User, otherUserId: string): Promise<Message[]> {
    return this.messagesRepository.find({
      where: [
        {
          sender: { id: user.id },
          receiver: { id: otherUserId },
        },
        {
          sender: { id: otherUserId },
          receiver: { id: user.id },
        },
      ],
      relations: ['sender', 'receiver', 'listing'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user: User): Promise<Message> {
    const message = await this.messagesRepository.findOne({
      where: [
        { id, sender: { id: user.id } },
        { id, receiver: { id: user.id } },
      ],
      relations: ['sender', 'receiver', 'listing'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }

  async update(
    id: string,
    updateMessageDto: UpdateMessageDto,
    user: User,
  ): Promise<Message> {
    const message = await this.findOne(id, user);

    if (message.receiver.id !== user.id) {
      throw new ForbiddenException('Cannot update messages you did not receive');
    }

    Object.assign(message, updateMessageDto);

    if (updateMessageDto.isRead) {
      message.readAt = new Date();
    }

    return this.messagesRepository.save(message);
  }

  async remove(id: string, user: User): Promise<void> {
    const message = await this.findOne(id, user);

    if (message.sender.id !== user.id && message.receiver.id !== user.id) {
      throw new ForbiddenException('Cannot delete messages you are not part of');
    }

    if (message.sender.id === user.id) {
      message.isDeleted = true;
    } else {
      message.isArchived = true;
    }

    await this.messagesRepository.save(message);
  }

  async mapToResponseDto(message: Message) {
    return {
      id: message.id,
      sender: message.sender,
      receiver: message.receiver,
      listing: message.listing,
      content: message.content,
      isRead: message.isRead,
      isArchived: message.isArchived,
      isDeleted: message.isDeleted,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }
} 
