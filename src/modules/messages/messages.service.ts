import { Injectable, NotFoundException, ForbiddenException, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Message } from './entities/message.entity';
import { User } from '../users/entities/user.entity';
import { Publication } from '../publications/entities/publication.entity';
import { CreateMessageDto, UpdateMessageDto, MessageResponseDto } from './dto/message.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { PublicationsService } from '../publications/publications.service'; // Import PublicationsService

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Publication)
    private readonly publicationsRepository: Repository<Publication>,
    private readonly notificationsService: NotificationsService,
    private readonly publicationsService: PublicationsService, // Inject PublicationsService
  ) {}

  async create(createMessageDto: CreateMessageDto, sender: User, publicationId: string): Promise<Message> {
    const receiver = await this.usersRepository.findOne({ where: { id: createMessageDto.receiverId } });

    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    const publication = await this.publicationsRepository.findOne({ where: { id: publicationId }, relations: ['seller'] });

    if (!publication) {
      throw new NotFoundException('Publication not found');
    }

    if (publication.seller.id === sender.id) {
      throw new ForbiddenException('Cannot send a message to your own publication');
    }

    const message = this.messagesRepository.create({
      ...createMessageDto,
      sender,
      receiver,
      publication,
    });

    const savedMessage = await this.messagesRepository.save(message);
    await this.notificationsService.createNewMessageNotification(savedMessage);
    return savedMessage;
  }

    async findAll(user: User, publicationId?: string): Promise<Message[]> {
        const where: FindOptionsWhere<Message> = {};

        // Build the where clause conditionally
        where.sender = { id: user.id };
        where.receiver = { id: user.id} ;


    if (publicationId) {
      where.publication = { id: publicationId };
    }

    return this.messagesRepository.find({
        where: [
            where.sender,
            where.receiver,
           {publication: where.publication} // Add publication condition
        ],
      relations: ['sender', 'receiver', 'publication'],
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
      relations: ['sender', 'receiver', 'publication', 'publication.images'],
      order: { createdAt: 'DESC' },
    });
  }

  async getConversations(user: User): Promise<Message[]> {
    const conversations = await this.messagesRepository
      .createQueryBuilder("message")
      .leftJoinAndSelect("message.sender", "sender")
      .leftJoinAndSelect("message.receiver", "receiver")
      .leftJoinAndSelect("message.publication", "publication")
      .leftJoinAndSelect("publication.images", "image")
      .where("sender.id = :userId OR receiver.id = :userId", { userId: user.id })
      .orderBy("message.createdAt", "DESC")
      .distinctOn(["publication.id"]) // Use distinctOn for latest message per publication
      .getMany();

    return conversations;
  }

  async findOne(id: string, user: User): Promise<Message> {
    const message = await this.messagesRepository.findOne({
      where: [{ id, sender: { id: user.id } }, { id, receiver: { id: user.id } }],
      relations: ['sender', 'receiver', 'publication'],
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
            sender: message.sender,   //  User, not UserResponseDto
            receiver: message.receiver, //  User, not UserResponseDto
            publication: this.publicationsService.mapToResponseDto(message.publication), // Use PublicationsService
            content: message.content,
            isRead: message.isRead,
            isArchived: message.isArchived,
            isDeleted: message.isDeleted,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
            // readAt: message.readAt
        };
    }

  async getConversation(userId1: string, userId2: string): Promise<Message[]> {
    return this.messagesRepository.find({
      where: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
      order: { createdAt: 'ASC' },
    });
  }
}