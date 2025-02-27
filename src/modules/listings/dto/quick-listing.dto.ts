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
import { ListingType, ListingStatus, PriceType } from '../entities/listing.entity';
import { LocationDto } from './listing.dto';
import { ContactDto } from './contact.dto';

export class QuickListingDto {
  @ApiProperty({ example: 'Software Developer Position' })
  @IsString()
  @MinLength(5)
  title: string;

  @ApiProperty({ example: 'Looking for a full-stack developer...' })
  @IsString()
  @MinLength(20)
  description: string;

  @ApiProperty({ enum: ListingType })
  @IsEnum(ListingType)
  type: ListingType;

  @ApiProperty({ enum: ListingStatus })
  @IsEnum(ListingStatus)
  status: ListingStatus = ListingStatus.ACTIVE;

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
