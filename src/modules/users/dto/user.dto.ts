import { IsEmail, IsString, IsOptional, IsEnum, IsBoolean, IsInt, Min, IsPhoneNumber, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'The email of the user',
  })
  @IsEmail()
  email: string = '';

  @ApiProperty({
    example: 'password123',
    description: 'The password of the user',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string = '';

  @ApiPropertyOptional({
    example: 'John',
    description: 'The first name of the user',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Doe',
    description: 'The last name of the user',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'The phone number of the user',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.USER })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SearchUsersDto {
  @ApiPropertyOptional({ description: 'Search query for name or email' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class LoginDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'The email of the user',
  })
  @IsEmail()
  email: string = '';

  @ApiProperty({
    example: 'password123',
    description: 'The password of the user',
  })
  @IsString()
  password: string = '';
}

export class UserResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The unique identifier of the user',
  })
  id: string = '';

  @ApiProperty({
    example: 'john@example.com',
    description: 'The email of the user',
  })
  email: string = '';

  @ApiProperty({
    example: 'John',
    description: 'The first name of the user',
  })
  firstName: string = '';

  @ApiProperty({
    example: 'Doe',
    description: 'The last name of the user',
  })
  lastName: string = '';

  @ApiProperty({
    example: '+1234567890',
    description: 'The phone number of the user',
  })
  phone: string = '';

  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
    description: 'The role of the user',
  })
  role: UserRole = UserRole.USER;

  @ApiProperty({
    example: true,
    description: 'Whether the user is active',
  })
  isActive: boolean = true;

  @ApiProperty({
    example: false,
    description: 'Whether the user is verified',
  })
  isVerified: boolean = false;

  @ApiProperty({
    example: '2024-01-26T12:00:00.000Z',
    description: 'When the user was created',
  })
  createdAt: Date = new Date();
} 

