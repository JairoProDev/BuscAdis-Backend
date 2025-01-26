import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { MessageStatus } from '../entities/message.entity';
import { UserResponseDto } from '../../users/dto/user.dto';
import { ListingResponseDto } from '../../listings/dto/listing.dto';

export class CreateMessageDto {
  @ApiProperty({
    description: 'The ID of the user to send the message to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  receiverId: string;

  @ApiProperty({
    description: 'The ID of the listing the message is about',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  listingId: string;

  @ApiProperty({
    description: 'The content of the message',
    example: 'Hello, I am interested in your listing. Is it still available?',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}

export class UpdateMessageDto {
  @ApiProperty({
    description: 'Whether the message has been read',
    example: true,
  })
  isRead?: boolean;

  @ApiProperty({
    description: 'Whether the message has been archived',
    example: true,
  })
  isArchived?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;
}

export class MessageResponseDto {
  @ApiProperty({
    description: 'The unique identifier for the message',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The user who sent the message',
    type: () => UserResponseDto,
  })
  sender: UserResponseDto;

  @ApiProperty({
    description: 'The user who received the message',
    type: () => UserResponseDto,
  })
  receiver: UserResponseDto;

  @ApiProperty({
    description: 'The listing the message is about',
    type: () => ListingResponseDto,
  })
  listing: ListingResponseDto;

  @ApiProperty({
    description: 'The content of the message',
    example: 'Hello, I am interested in your listing. Is it still available?',
  })
  content: string;

  @ApiProperty({
    description: 'Whether the message has been read',
    example: false,
  })
  isRead: boolean;

  @ApiProperty({
    description: 'Whether the message has been archived',
    example: false,
  })
  isArchived: boolean;

  @ApiProperty({
    description: 'Whether the message has been deleted',
    example: false,
  })
  isDeleted: boolean;

  @ApiProperty({
    description: 'The date when the message was created',
    example: '2024-03-20T15:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The date when the message was last updated',
    example: '2024-03-20T15:30:00.000Z',
  })
  updatedAt: Date;
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
