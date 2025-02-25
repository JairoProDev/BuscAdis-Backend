import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

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
  @ValidateNested()
  @Type(() => CategoryDto)
  @IsOptional()
  category?: CategoryDto;

  @ApiProperty()
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => ContactDto)
  @IsNotEmpty()
  contact: ContactDto;

  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  @IsOptional()
  media?: any[];

  @ApiProperty()
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => PriceDto)
  @IsOptional()
  price?: PriceDto;
} 
