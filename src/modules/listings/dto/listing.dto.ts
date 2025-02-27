import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  IsObject,
  IsUUID,
  IsEmail,
  IsPhoneNumber,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
  MinLength,
  IsNotEmpty,
  IsInt, // Import IsInt
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ListingType, ListingStatus, PriceType } from '../entities/listing.entity';
import { UserResponseDto } from 'src/modules/users/dto/user.dto'; // Import UserResponseDto

export class ImageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  alt?: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  order: number;

  // Optional ID and thumbnail
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnail?: string;
}

export class LocationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  coordinates?: {
    lat: number;
    lon: number;
  };
}


// DTO for quick listing creation
export class QuickListingDto {
    @ApiProperty({ example: 'Software Developer Position' })
    @IsString()
    @IsNotEmpty()
    @MinLength(5)
    title: string;

    @ApiProperty({ example: 'Looking for a full-stack developer...' })
    @IsString()
    @IsNotEmpty()
    @MinLength(20)
    description: string;

    @ApiProperty({ enum: ListingType })
    @IsEnum(ListingType)
    @IsNotEmpty()
    type: ListingType;

    @ApiProperty()
    @ValidateNested()
    @Type(() => ContactDto) // Use ContactDto
    @IsNotEmpty()
    contact: ContactDto;

    @ApiPropertyOptional()
    @IsOptional()
    @ValidateNested()
    @Type(() => LocationDto) // Use LocationDto
    location?: LocationDto;


    @ApiProperty({ type: [ImageDto], required: false })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ImageDto)
    images?: ImageDto[];


    @ApiProperty({ type: [String] })
    @IsOptional()
    @IsArray()
    @IsUUID(undefined, { each: true })
    @ArrayMinSize(1)
    categoryIds?: string[];

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    price: number;
}

// DTO for advanced listing creation
export class CreateListingDto extends QuickListingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({
    enum: PriceType,
    example: PriceType.FIXED,
    description: 'The type of price',
  })
  @IsEnum(PriceType)
  @IsNotEmpty()
  priceType: PriceType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  attributes?: Record<string, any>;

  @ApiProperty({ type: [ImageDto], description: 'The images of the listing' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageDto)
  images?: ImageDto[];

  @ApiProperty({ type: [String] })
  @IsNotEmpty()
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
        enum: ListingStatus,
        default: ListingStatus.ACTIVE,
        description: 'The status of the listing'
    })
    @IsEnum(ListingStatus)
    @IsOptional() // Status is optional, with a default
    status?: ListingStatus = ListingStatus.ACTIVE;

  @ApiProperty({
    description: 'The location of the listing',
  })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsNotEmpty()
  location: LocationDto;
}

export class UpdateListingDto extends PartialType(CreateListingDto) {
  @IsOptional()
  @IsString()
  slug?: string;
}

export class SearchListingDto {
  @ApiPropertyOptional({ description: 'Search query for name or email' })
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
    sellerId?: string; // Add sellerId

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

    @ApiPropertyOptional({
      type: Object,
      description: 'Location filter',
      example: { latitude: 40.7128, longitude: -74.0060, radius: 10 }
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto) // Validate using LocationDto
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
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sort?: string;

    @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc'})
    @IsOptional()
    @IsEnum(['asc', 'desc'])
    order?: 'asc' | 'desc';

    @ApiPropertyOptional({
        description: 'Price range filter',
        type: Object,
        example: {min: 50, max: 200}
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => PriceRangeDto) // Use PriceRangeDto
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

export class PriceRangeDto{
    @ApiPropertyOptional({
        description: "Minimum Price",
        type: Number
    })
    @IsOptional()
    @IsNumber()
    min?:number

    @ApiPropertyOptional({
        description: "Maximum Price",
        type: Number
    })
    @IsOptional()
    @IsNumber()
    max?:number
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


    @ApiProperty({ type: () => ContactDto }) // Use ContactDto
    contact: ContactDto;


  @ApiProperty({ type: () => UserResponseDto })
  seller: UserResponseDto;

    @ApiProperty({ type: [ImageDto] }) // Use ImageDto
    images: ImageDto[];

    @ApiProperty({ type: [Object] })
    categories: {
        id: string;
        name: string;
    }[];

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  views: number;

    @ApiPropertyOptional({
      type: Number,
      description: 'Number of favorites'
  })
  @IsOptional() // Optional
  favorites?: number; // Use number

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isFeatured: boolean;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty()
  isUrgent: boolean;

  @ApiPropertyOptional()
  publishedAt?: Date;

  @ApiPropertyOptional()
  expiresAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Relevance score' })
  @IsOptional()
  @IsNumber()
  relevanceScore?: number;
}


export class ContactDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @IsPhoneNumber()
    phone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
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