import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
// No need to import MessageStatus from the entity here.  It's not used in the DTOs
import { UserResponseDto } from '../../users/dto/user.dto';
import { ClassifiedadResponseDto } from '../../classifiedads/dto/classifiedad.dto';

export class CreateMessageDto {
  @ApiProperty({
    description: 'The ID of the user to send the message to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty() // Add IsNotEmpty
  receiverId: string;

  @ApiProperty({
    description: 'The ID of the classifiedad the message is about',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty() // Add IsNotEmpty
  classifiedadId: string;

  @ApiProperty({
    description: 'The content of the message',
    example: 'Hello, I am interested in your classifiedad. Is it still available?',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}

export class UpdateMessageDto {
  @ApiPropertyOptional({ // Use ApiPropertyOptional for optional properties
    description: 'Whether the message has been read',
    example: true,
  })
  @IsOptional() // Mark as optional
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({ // Use ApiPropertyOptional
    description: 'Whether the message has been archived',
    example: true,
  })
  @IsOptional() // Mark as optional
  @IsBoolean()
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
  sender: UserResponseDto; // Correct: uses UserResponseDto

  @ApiProperty({
    description: 'The user who received the message',
    type: () => UserResponseDto,
  })
  receiver: UserResponseDto; // Correct: uses UserResponseDto

  @ApiProperty({
    description: 'The classifiedad the message is about',
    type: () => ClassifiedadResponseDto,
  })
  classifiedad: ClassifiedadResponseDto; // Correct: uses ClassifiedadResponseDto

  @ApiProperty({
    description: 'The content of the message',
    example: 'Hello, I am interested in your classifiedad. Is it still available?',
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