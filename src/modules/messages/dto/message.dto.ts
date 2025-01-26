import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { MessageStatus } from '../entities/message.entity';

export class CreateMessageDto {
  @ApiProperty({ example: 'Hello, I am interested in your product' })
  @IsString()
  content: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  recipientId: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  productId?: string;
}

export class UpdateMessageDto {
  @ApiPropertyOptional({ enum: MessageStatus })
  @IsOptional()
  @IsEnum(MessageStatus)
  status?: MessageStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;
}

export class MessageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  status: MessageStatus;

  @ApiProperty()
  isArchived: boolean;

  @ApiProperty()
  isDeleted: boolean;

  @ApiProperty()
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  @ApiProperty()
  recipient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  @ApiPropertyOptional()
  product?: {
    id: string;
    title: string;
    slug: string;
    price: number;
  };

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  readAt?: Date;
}

export class ConversationDto {
  @ApiProperty()
  otherUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  @ApiProperty()
  lastMessage: MessageResponseDto;

  @ApiProperty()
  unreadCount: number;

  @ApiProperty()
  updatedAt: Date;
} 