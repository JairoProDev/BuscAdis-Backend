import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { User } from '../users/entities/user.entity';
import { Listing } from '../listings/entities/listing.entity';
import { CreateMessageDto, UpdateMessageDto, MessageResponseDto } from './dto/message.dto';
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

  async create(createMessageDto: CreateMessageDto, sender: User, listingId: string): Promise<Message> {
    const receiver = await this.usersRepository.findOne({ where: { id: createMessageDto.receiverId } });

    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    const listing = await this.listingsRepository.findOne({ where: { id: listingId }, relations: ['seller'] });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.seller.id === sender.id) {
      throw new ForbiddenException('Cannot send a message to your own listing');
    }

    const message = this.messagesRepository.create({
      ...createMessageDto,
      sender,
      receiver,
      listing,
    });

    const savedMessage = await this.messagesRepository.save(message);
    await this.notificationsService.createNewMessageNotification(savedMessage);
    return savedMessage;
  }

  async findAll(user: User, listingId?: string): Promise<Message[]> {
    const where: { sender?: { id: string }; receiver?: { id: string }; listing?: { id: string } }[] = [
      { sender: { id: user.id } },
      { receiver: { id: user.id } },
    ];
    if (listingId) {
      where.forEach((condition) => (condition.listing = { id: listingId }));
    }
    return this.messagesRepository.find({
      where,
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
      relations: ['sender', 'receiver', 'listing', 'listing.images'],
      order: { createdAt: 'DESC' },
    });
  }

  async getConversations(user: User): Promise<Message[]> {
    const conversations = await this.messagesRepository
      .createQueryBuilder("message")
      .leftJoinAndSelect("message.sender", "sender")
      .leftJoinAndSelect("message.receiver", "receiver")
      .leftJoinAndSelect("message.listing", "listing")
      .leftJoinAndSelect("listing.images", "image")
      .where("sender.id = :userId OR receiver.id = :userId", { userId: user.id })
      .orderBy("message.createdAt", "DESC")
      .distinctOn(["listing.id"])
      .getMany();

    return conversations;
  }

  async findOne(id: string, user: User): Promise<Message> {
    const message = await this.messagesRepository.findOne({
      where: [{ id, sender: { id: user.id } }, { id, receiver: { id: user.id } }],
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

  mapToResponseDto(message: Message): MessageResponseDto {
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