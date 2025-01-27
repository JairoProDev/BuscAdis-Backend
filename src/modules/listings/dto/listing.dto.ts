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
  @ApiProperty({
    example: '123 Main St',
    description: 'The street address',
  })
  @IsString()
  address: string = '';

  @ApiProperty({
    example: 'New York',
    description: 'The city',
  })
  @IsString()
  city: string = '';

  @ApiProperty({
    example: 'NY',
    description: 'The state',
  })
  @IsString()
  state: string = '';

  @ApiProperty({
    example: 'USA',
    description: 'The country',
  })
  @IsString()
  country: string = '';

  @ApiPropertyOptional({
    description: 'The coordinates of the location',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;
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

class ContactDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsPhoneNumber()
  whatsapp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showEmail?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showPhone?: boolean;
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

export class UpdateListingDto extends CreateListingDto {
  @ApiPropertyOptional({
    enum: ListingStatus,
    example: ListingStatus.PUBLISHED,
    description: 'The status of the listing',
  })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;
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
}

export class ListingResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The unique identifier of the listing',
  })
  id: string = '';

  @ApiProperty({
    example: 'Beautiful house for sale',
    description: 'The title of the listing',
  })
  title: string = '';

  @ApiProperty({
    example: 'beautiful-house-for-sale',
    description: 'The slug of the listing',
  })
  slug: string = '';

  @ApiProperty({
    example: 'This is a beautiful house in a great location...',
    description: 'The description of the listing',
  })
  description: string = '';

  @ApiProperty({
    example: 100000,
    description: 'The price of the listing',
  })
  price: number = 0;

  @ApiProperty({
    enum: PriceType,
    example: PriceType.FIXED,
    description: 'The type of price',
  })
  priceType: PriceType = PriceType.FIXED;

  @ApiProperty({
    enum: ListingStatus,
    example: ListingStatus.PUBLISHED,
    description: 'The status of the listing',
  })
  status: ListingStatus = ListingStatus.DRAFT;

  @ApiPropertyOptional()
  attributes?: Record<string, any>;

  @ApiProperty({
    type: [ImageDto],
    description: 'The images of the listing',
  })
  images: ImageDto[] = [];

  @ApiProperty({
    description: 'The location of the listing',
  })
  location: LocationDto = new LocationDto();

  @ApiProperty({
    example: 0,
    description: 'The number of views',
  })
  views: number = 0;

  @ApiProperty({
    example: true,
    description: 'Whether the listing is active',
  })
  isActive: boolean = true;

  @ApiProperty({
    description: 'The seller of the listing',
  })
  seller: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } = {
    id: '',
    firstName: '',
    lastName: '',
    email: '',
  };

  @ApiProperty({
    example: '2024-01-26T12:00:00.000Z',
    description: 'When the listing was created',
  })
  createdAt: Date = new Date();

  @ApiProperty({
    example: '2024-01-26T12:00:00.000Z',
    description: 'When the listing was last updated',
  })
  updatedAt: Date = new Date();

  @ApiPropertyOptional({
    example: '2024-01-26T12:00:00.000Z',
    description: 'When the listing was published',
  })
  publishedAt?: Date;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional()
  distance?: number;

  @ApiPropertyOptional()
  relevanceScore?: number;

  @ApiPropertyOptional()
  expiresAt?: Date;
} 

