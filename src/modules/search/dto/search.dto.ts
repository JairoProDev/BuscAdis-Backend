import { ApiProperty } from '@nestjs/swagger';
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
import { Classifiedad } from '../../classifiedads/entities/classifiedad.entity';

export enum SortOption {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  DATE_DESC = 'date_desc',
  RELEVANCE = 'relevance',
}

export class LocationSearchDto {
  @ApiProperty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lon: number;
}

export class SearchDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  priceMin?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  priceMax?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  condition?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => LocationSearchDto)
  location?: LocationSearchDto;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(500)
  radius?: number;

  @ApiProperty({ required: false, enum: SortOption })
  @IsEnum(SortOption)
  @IsOptional()
  sort?: SortOption;

  @ApiProperty({ required: false, default: 1 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiProperty({ required: false, default: 10 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;
}

export class PriceStatsDto {
  @ApiProperty()
  min: number;

  @ApiProperty()
  max: number;

  @ApiProperty()
  avg: number;

  @ApiProperty()
  sum: number;

  @ApiProperty()
  count: number;
}

export class CategoryBucketDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  count: number;
}

export class ConditionBucketDto {
  @ApiProperty()
  condition: string;

  @ApiProperty()
  count: number;
}

export class SearchAggregationsDto {
  @ApiProperty()
  priceStats: PriceStatsDto;

  @ApiProperty({ type: [ConditionBucketDto] })
  conditions: ConditionBucketDto[];

  @ApiProperty({ type: [CategoryBucketDto] })
  categories: CategoryBucketDto[];
}

export class SearchResponseDto {
  @ApiProperty({ type: [Classifiedad] })
  items: Classifiedad[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  pages: number;

  @ApiProperty()
  aggregations: SearchAggregationsDto;
} 