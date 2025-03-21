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
import { PublicationType, PublicationStatus, PriceType } from '../entities/publication.entity';
import { UserResponseDto } from 'src/modules/users/dto/user.dto'; // Import UserResponseDto
import { ContactDto } from './contact.dto';
import { ImageDto } from '../../images/dto/image.dto';
import { LocationDto } from './location.dto';

export class QuickPublicationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: PublicationType })
  @IsEnum(PublicationType)
  @IsNotEmpty()
  type: PublicationType;

  @ApiProperty({ type: [ImageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageDto)
  images: ImageDto[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  categoryIds: string[];

  @ApiProperty()
  @IsNumber()
  price: number;

  @ApiProperty({ enum: PriceType })
  @IsEnum(PriceType)
  @IsNotEmpty()
  priceType: PriceType;

  @ApiProperty()
  @Type(() => ContactDto)
  @ValidateNested()
  contact: ContactDto;

  @ApiProperty()
  @Type(() => LocationDto)
  @ValidateNested()
  location: LocationDto;
}

// DTO for advanced publication creation
export class CreatePublicationDto extends QuickPublicationDto {
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

  @ApiProperty({ type: [ImageDto], description: 'The images of the publication' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageDto)
  images: ImageDto[];

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
    enum: PublicationStatus,
    default: PublicationStatus.ACTIVE,
    description: 'The status of the publication'
  })
  @IsEnum(PublicationStatus)
  @IsOptional()
  status?: PublicationStatus = PublicationStatus.ACTIVE;

  @ApiProperty({
    description: 'The location of the publication',
  })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsNotEmpty()
  location: LocationDto;
}

export class UpdatePublicationDto extends PartialType(CreatePublicationDto) {
  @IsOptional()
  @IsString()
  slug?: string;
}

export class SearchPublicationDto {
  @ApiPropertyOptional({ description: 'Search query for name or email' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ enum: PublicationType })
  @IsOptional()
  @IsEnum(PublicationType)
  type?: PublicationType;

  @ApiPropertyOptional({ enum: PublicationStatus })
  @IsOptional()
  @IsEnum(PublicationStatus)
  status?: PublicationStatus;

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

export class PublicationResponseDto {
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

  @ApiProperty({ enum: PublicationType })
  type: PublicationType;

  @ApiProperty({ enum: PublicationStatus })
  status: PublicationStatus;

  @ApiProperty({ type: () => LocationDto })
  location: LocationDto;

  @ApiProperty({ type: () => ContactDto })
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

  @ApiProperty({
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