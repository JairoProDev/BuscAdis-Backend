import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageStatus } from './entities/message.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import {
  CreateMessageDto,
  UpdateMessageDto,
  MessageResponseDto,
  ConversationDto,
} from './dto/message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(
    createMessageDto: CreateMessageDto,
    sender: User,
  ): Promise<Message> {
    const recipient = await this.userRepository.findOne({
      where: { id: createMessageDto.recipientId },
    });

    if (!recipient) {
      throw new NotFoundException('Recipient not found');
    }

    let product: Product | null = null;
    if (createMessageDto.productId) {
      product = await this.productRepository.findOne({
        where: { id: createMessageDto.productId },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }
    }

    const message = this.messageRepository.create({
      content: createMessageDto.content,
      sender,
      recipient,
      product,
    });

    return this.messageRepository.save(message);
  }

  async findOne(id: string, user: User): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: ['sender', 'recipient', 'product'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.sender.id !== user.id && message.recipient.id !== user.id) {
      throw new ForbiddenException('You can only access your own messages');
    }

    if (message.recipient.id === user.id && message.status !== MessageStatus.READ) {
      message.status = MessageStatus.READ;
      message.readAt = new Date();
      await this.messageRepository.save(message);
    }

    return message;
  }

  async update(
    id: string,
    updateMessageDto: UpdateMessageDto,
    user: User,
  ): Promise<Message> {
    const message = await this.findOne(id, user);

    if (message.sender.id !== user.id && message.recipient.id !== user.id) {
      throw new ForbiddenException('You can only update your own messages');
    }

    Object.assign(message, updateMessageDto);

    return this.messageRepository.save(message);
  }

  async getConversations(user: User): Promise<ConversationDto[]> {
    const messages = await this.messageRepository
      .createQueryBuilder('message')
      .innerJoinAndSelect('message.sender', 'sender')
      .innerJoinAndSelect('message.recipient', 'recipient')
      .leftJoinAndSelect('message.product', 'product')
      .where(
        '(message.sender_id = :userId OR message.recipient_id = :userId) AND message.is_deleted = false',
        { userId: user.id },
      )
      .orderBy('message.created_at', 'DESC')
      .getMany();

    const conversationMap = new Map<string, ConversationDto>();

    for (const message of messages) {
      const otherUser =
        message.sender.id === user.id ? message.recipient : message.sender;
      const conversationKey = otherUser.id;

      if (!conversationMap.has(conversationKey)) {
        const unreadCount = await this.messageRepository.count({
          where: {
            sender: { id: otherUser.id },
            recipient: { id: user.id },
            status: MessageStatus.SENT,
            isDeleted: false,
          },
        });

        conversationMap.set(conversationKey, {
          otherUser: {
            id: otherUser.id,
            firstName: otherUser.firstName,
            lastName: otherUser.lastName,
            email: otherUser.email,
          },
          lastMessage: this.mapToResponseDto(message),
          unreadCount,
          updatedAt: message.updatedAt,
        });
      }
    }

    return Array.from(conversationMap.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
  }

  async getConversation(
    otherUserId: string,
    user: User,
  ): Promise<MessageResponseDto[]> {
    const messages = await this.messageRepository.find({
      where: [
        {
          sender: { id: user.id },
          recipient: { id: otherUserId },
          isDeleted: false,
        },
        {
          sender: { id: otherUserId },
          recipient: { id: user.id },
          isDeleted: false,
        },
      ],
      relations: ['sender', 'recipient', 'product'],
      order: { createdAt: 'ASC' },
    });

    // Mark messages as read
    const unreadMessages = messages.filter(
      message =>
        message.recipient.id === user.id &&
        message.status !== MessageStatus.READ,
    );

    if (unreadMessages.length > 0) {
      await this.messageRepository
        .createQueryBuilder()
        .update(Message)
        .set({ status: MessageStatus.READ, readAt: new Date() })
        .whereInIds(unreadMessages.map(m => m.id))
        .execute();
    }

    return messages.map(message => this.mapToResponseDto(message));
  }

  private mapToResponseDto(message: Message): MessageResponseDto {
    return {
      id: message.id,
      content: message.content,
      status: message.status,
      isArchived: message.isArchived,
      isDeleted: message.isDeleted,
      sender: {
        id: message.sender.id,
        firstName: message.sender.firstName,
        lastName: message.sender.lastName,
        email: message.sender.email,
      },
      recipient: {
        id: message.recipient.id,
        firstName: message.recipient.firstName,
        lastName: message.recipient.lastName,
        email: message.recipient.email,
      },
      product: message.product
        ? {
            id: message.product.id,
            title: message.product.title,
            slug: message.product.slug,
            price: message.product.price,
          }
        : undefined,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      readAt: message.readAt,
    };
  }
} 