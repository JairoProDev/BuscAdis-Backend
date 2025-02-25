import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsBoolean,
  IsDate,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}

export class UpdateNotificationDto {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty()
  isRead: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  data?: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  readAt?: Date;

  @ApiProperty()
  expiresAt?: Date;
}

export class NotificationPreferencesDto {
  @ApiProperty()
  @IsBoolean()
  emailNotifications: boolean;

  @ApiProperty()
  @IsBoolean()
  pushNotifications: boolean;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'boolean' } })
  @IsObject()
  preferences: {
    [key in NotificationType]?: {
      email: boolean;
      push: boolean;
    };
  };
} 