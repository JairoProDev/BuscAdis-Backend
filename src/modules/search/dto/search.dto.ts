import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum SortOption {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  DATE_DESC = 'date_desc',
  RELEVANCE = 'relevance',
}

export class LocationDto {
  @ApiProperty({ description: 'Latitude', example: 40.7128 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ description: 'Longitude', example: -74.0060 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lon: number;
}

export class SearchDto {
  @ApiPropertyOptional({ description: 'Search query', example: 'vintage camera' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: 'Category ID or slug' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Minimum price', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @ApiPropertyOptional({ description: 'Maximum price', example: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMax?: number;

  @ApiPropertyOptional({ description: 'Item condition' })
  @IsOptional()
  @IsString()
  condition?: string;

  @ApiPropertyOptional({ type: LocationDto })
  @IsOptional()
  @Type(() => LocationDto)
  @IsObject()
  location?: LocationDto;

  @ApiPropertyOptional({
    description: 'Search radius in kilometers',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(500)
  radius?: number;

  @ApiPropertyOptional({ enum: SortOption })
  @IsOptional()
  @IsEnum(SortOption)
  sort?: SortOption;

  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class PriceStatsDto {
  @ApiProperty()
  count: number;

  @ApiProperty()
  min: number;

  @ApiProperty()
  max: number;

  @ApiProperty()
  avg: number;

  @ApiProperty()
  sum: number;
}

export class AggregationBucketDto {
  @ApiProperty()
  key: string;

  @ApiProperty()
  doc_count: number;
}

export class SearchAggregationsDto {
  @ApiProperty({ type: PriceStatsDto })
  priceStats: PriceStatsDto;

  @ApiProperty({ type: [AggregationBucketDto] })
  conditions: AggregationBucketDto[];

  @ApiProperty({ type: [AggregationBucketDto] })
  categories: AggregationBucketDto[];
}

export class SearchResponseDto {
  @ApiProperty({ description: 'Search results' })
  items: any[];

  @ApiProperty({ description: 'Total number of results' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ type: SearchAggregationsDto })
  aggregations: SearchAggregationsDto;
} 