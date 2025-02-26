import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  IsObject,
  IsUrl,
  IsUUID,
  IsEmail,
  IsPhoneNumber,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ListingType, ListingStatus, PriceType } from '../entities/listing.entity';

export class ImageDto {
  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: 'The URL of the image',
  })
  @IsString()
  url: string = '';

  @ApiPropertyOptional({
    example: 'Beautiful house',
    description: 'Alternative text for the image',
  })
  @IsOptional()
  @IsString()
  alt?: string;

  @ApiProperty({
    example: 1,
    description: 'The order of the image in the gallery',
  })
  @IsNumber()
  @Min(0)
  order: number = 0;
}

export class LocationDto {
  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  state: string;

  @ApiProperty()
  @IsString()
  country: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  coordinates?: {
    lat: number;
    lon: number;
  };
}

export class CoordinatesDto {
  @ApiProperty({
    example: 40.7128,
    description: 'The latitude',
  })
  @IsNumber()
  lat: number = 0;

  @ApiProperty({
    example: -74.0060,
    description: 'The longitude',
  })
  @IsNumber()
  lon: number = 0;
}

export class ContactDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiProperty()
  @IsBoolean()
  showEmail: boolean;

  @ApiProperty()
  @IsBoolean()
  showPhone: boolean;
}

// DTO for quick listing creation
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

  @ApiProperty()
  @ValidateNested()
  @Type(() => ContactDto)
  contact: ContactDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}

// DTO for advanced listing creation
export class CreateListingDto extends QuickListingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({
    example: 100000,
    description: 'The price of the listing',
  })
  @IsNumber()
  @Min(0)
  price: number = 0;

  @ApiProperty({
    enum: PriceType,
    example: PriceType.FIXED,
    description: 'The type of price',
  })
  @IsEnum(PriceType)
  priceType: PriceType = PriceType.FIXED;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  attributes?: Record<string, any>;

  @ApiProperty({
    type: [ImageDto],
    description: 'The images of the listing',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageDto)
  images: ImageDto[] = [];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  @ArrayMinSize(1)
  categoryIds: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @ApiProperty({
    description: 'The location of the listing',
  })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto = new LocationDto();
}

export class UpdateListingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(5)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(20)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ enum: PriceType })
  @IsOptional()
  @IsEnum(PriceType)
  priceType?: PriceType;

  @ApiPropertyOptional({ enum: ListingType })
  @IsOptional()
  @IsEnum(ListingType)
  type?: ListingType;

  @ApiPropertyOptional({ enum: ListingStatus })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({ type: () => LocationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @ApiPropertyOptional({ type: () => ContactDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactDto)
  contact?: ContactDto;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class SearchListingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ enum: ListingType })
  @IsOptional()
  @IsEnum(ListingType)
  type?: ListingType;

  @ApiPropertyOptional({ enum: ListingStatus })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // in kilometers
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isFeatured?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isVerified?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isUrgent?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  priceRange?: {
    min?: number;
    max?: number;
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  categoryIds?: string[];
}

export class ListingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  price: number;

  @ApiProperty({ enum: PriceType })
  priceType: PriceType;

  @ApiProperty({ enum: ListingType })
  type: ListingType;

  @ApiProperty({ enum: ListingStatus })
  status: ListingStatus;

  @ApiProperty({ type: () => LocationDto })
  location: LocationDto;

  @ApiProperty({ type: () => ContactDto })
  contact: {
    showEmail: boolean;
    showPhone: boolean;
    name?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
  };

  @ApiProperty()
  seller: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  @ApiProperty({ type: [Object] })
  categories: {
    id: string;
    name: string;
  }[];

  @ApiProperty({ type: [Object] })
  images: {
    id: string;
    url: string;
    thumbnail?: string;
  }[];

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  views: number;

  @ApiProperty()
  favorites: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isFeatured: boolean;

  @ApiPropertyOptional()
  publishedAt?: Date;

  @ApiPropertyOptional()
  expiresAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
} 

