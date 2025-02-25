import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

class LocationFilter {
  @ApiProperty()
  @IsString()
  district: string;

  @ApiProperty()
  @IsString()
  region: string;
}

class PriceFilter {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsOptional()
  min?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsOptional()
  max?: number;
}

export class SearchListingDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  @Type(() => LocationFilter)
  location?: LocationFilter;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  @Type(() => PriceFilter)
  price?: PriceFilter;

  @ApiProperty({ default: 1 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @ApiProperty({ default: 10 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit: number = 10;
} 