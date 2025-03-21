import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsArray,
  IsUUID,
  ValidateNested,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PublicationType, PublicationStatus, PriceType } from '../entities/publication.entity';
import { LocationDto } from './location.dto';
import { ContactDto } from './contact.dto';

export class QuickPublicationDto {
  @ApiProperty({ example: 'Software Developer Position' })
  @IsString()
  @MinLength(5)
  title: string;

  @ApiProperty({ example: 'Looking for a full-stack developer...' })
  @IsString()
  @MinLength(20)
  description: string;

  @ApiProperty({ enum: PublicationType })
  @IsEnum(PublicationType)
  type: PublicationType;

  @ApiProperty({ enum: PublicationStatus })
  @IsEnum(PublicationStatus)
  status: PublicationStatus = PublicationStatus.ACTIVE;

  @ApiProperty()
  @IsNumber()
  price: number;

  @ApiProperty({ enum: PriceType })
  @IsEnum(PriceType)
  priceType: PriceType;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  categoryIds: string[];

  @ApiProperty({ type: [Object], required: false })
  @IsOptional()
  @IsArray()
  images?: Express.Multer.File[];

  @ApiProperty({ type: () => LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiProperty({ type: () => ContactDto })
  @ValidateNested()
  @Type(() => ContactDto)
  contact: ContactDto;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
} 
