import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  IsBoolean,
  IsObject,
  IsUrl,
  IsUUID,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus, ProductCondition, PriceType } from '../entities/product.entity';

class ImageDto {
  @ApiProperty({ example: 'https://example.com/image.jpg' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ example: 'Product front view' })
  @IsOptional()
  @IsString()
  alt?: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(0)
  order: number;

  constructor() { 
    this.url = '';  // Initialize url
    this.order = 0; // Initialize order
  }
}

class LocationDto {
  @ApiProperty({ example: '123 Main St' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'New York' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'NY' })
  @IsString()
  state: string;

  @ApiProperty({ example: 'USA' })
  @IsString()
  country: string;

  @ApiProperty({
    example: {
      latitude: 40.7128,
      longitude: -74.0060
    }
  })
  @IsObject()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates: CoordinatesDto;

  constructor() {
    this.address = '';      // Initialize address
    this.city = '';        // Initialize city
    this.state = '';       // Initialize state
    this.country = '';     // Initialize country
    this.coordinates = new CoordinatesDto(); // Initialize coordinates with a new instance
  }
}

class CoordinatesDto {
  @ApiProperty({ example: 40.7128 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: -74.0060 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  constructor() {
    this.latitude = 0;    // Initialize latitude
    this.longitude = 0;   // Initialize longitude
  }
}

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 12 Pro Max' })
  @IsString()
  title?: string; // Optional

  @ApiPropertyOptional({ example: 'iphone-12-pro-max' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ example: 'Like new iPhone 12 Pro Max, 256GB, Pacific Blue' })
  @IsString()
  description?: string; // Optional

  @ApiProperty({ example: 899.99 })
  @IsNumber()
  @Min(0)
  price?: number; // Optional

  @ApiProperty({ enum: PriceType, default: PriceType.FIXED })
  @IsEnum(PriceType)
  priceType?: PriceType; // Optional

  @ApiProperty({ enum: ProductCondition, default: ProductCondition.NEW })
  @IsEnum(ProductCondition)
  condition?: ProductCondition; // Optional

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  attributes?: Record<string, any>;

  @ApiProperty({ type: [ImageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => ImageDto)
  images?: ImageDto[]; // Optional

  @ApiProperty({ type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto; // Optional

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  @ArrayMinSize(1)
  categoryIds?: string[]; // Optional

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  constructor() {
    this.title = '';
    this.description = '';
    this.price = 0;
    this.priceType = PriceType.FIXED;
    this.condition = ProductCondition.NEW;
    this.images = []; // Initialize as empty array
    this.location = new LocationDto();
    this.categoryIds = []; // Initialize as empty array
  }
}

export class UpdateProductDto extends CreateProductDto {
  @ApiPropertyOptional({ example: 'iPhone 12 Pro Max' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 899.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ type: [ImageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageDto)
  images?: ImageDto[]; // Correct type: array of ImageDto

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  categoryIds?: string[]; // Correct type: array of strings
}

export class SearchProductsDto {
  @ApiPropertyOptional({ description: 'Search query for title and description' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ enum: ProductCondition })
  @IsOptional()
  @IsEnum(ProductCondition)
  condition?: ProductCondition;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  sellerId?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 1000 })
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

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isVerified?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ example: 'createdAt' })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ example: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order?: 'asc' | 'desc';
}

export class ProductResponseDto {
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

  @ApiProperty()
  priceType: PriceType;

  @ApiProperty()
  status: ProductStatus;

  @ApiProperty()
  condition: ProductCondition;

  @ApiProperty()
  images: ImageDto;

  @ApiProperty()
  location: LocationDto;

  @ApiProperty()
  views: number;

  @ApiProperty()
  likes: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isFeatured: boolean;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty()
  seller: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  @ApiProperty()
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;

  @ApiPropertyOptional()
  distance?: number;

  @ApiPropertyOptional()
  relevanceScore?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  publishedAt?: Date;

  @ApiPropertyOptional()
  soldAt?: Date;

  constructor() {
    this.id = '';
    this.title = '';
    this.slug = '';
    this.description = '';
    this.price = 0;
    this.priceType = PriceType.FIXED;
    this.status = ProductStatus.DRAFT;
    this.condition = ProductCondition.NEW;
    this.images = new ImageDto();
    this.location = new LocationDto();
    this.views = 0;
    this.likes = 0;
    this.isActive = false;
    this.isFeatured = false;
    this.isVerified = false;
    this.seller = { id: '', firstName: '', lastName: '', email: '' };
    this.categories =[];
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
} 