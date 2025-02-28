import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber } from 'class-validator';

export class ImageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bucket: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  listingId: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  order: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  alt: string;

  @ApiPropertyOptional()
  data?: Buffer;
}

export class CreateImageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bucket: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  listingId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  thumbnail?: string;
}

export class UpdateImageDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  key?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  bucket?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  mimeType?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  thumbnail?: string;
}

export class ImageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  bucket: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  listingId: string;

  @ApiProperty()
  thumbnail?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
} 