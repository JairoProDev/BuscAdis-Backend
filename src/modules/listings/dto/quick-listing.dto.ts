import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, ValidateNested, IsArray, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ListingStatus, ListingType, PriceType } from '../entities/listing.entity';

export class LocationDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  district?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  region?: string;
}

export class ContactDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  whatsapp: string;
}

export class PriceDto {
  @ApiProperty()
  @IsOptional()
  amount?: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  type?: string;
}

export class CategoryDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  name?: string;
}

export class QuickListingDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiProperty()
  @IsEnum(PriceType)
  @IsOptional()
  priceType?: PriceType;

  @ApiProperty()
  @IsEnum(ListingType)
  @IsOptional()
  type?: ListingType;

  @ApiProperty()
  @IsEnum(ListingStatus)
  @IsOptional()
  status?: ListingStatus;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  categoryIds?: string[];

  @ApiProperty()
  @IsArray()
  @IsOptional()
  images?: Express.Multer.File[];

  @ApiProperty()
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: {
    address: string;
    city: string;
    state: string;
    country: string;
    coordinates?: {
      lat: number;
      lon: number;
    };
  };

  @ApiProperty()
  @ValidateNested()
  @Type(() => ContactDto)
  @IsOptional()
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    showEmail?: boolean;
    showPhone?: boolean;
  };

  @ApiProperty()
  @IsOptional()
  metadata?: Record<string, any>;
} 
