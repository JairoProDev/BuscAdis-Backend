import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
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

  @ApiProperty()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates: CoordinatesDto;
}

class CoordinatesDto {
  @ApiProperty()
  @IsNotEmpty()
  lat: number;

  @ApiProperty()
  @IsNotEmpty()
  lon: number;
}

class ContactDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  whatsapp: string;
}

class PriceDto {
  @ApiProperty()
  @IsNotEmpty()
  amount: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: string;
}

class CategoryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;
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
  category: CategoryDto;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => ContactDto)
  contact: ContactDto;

  @ApiProperty({ type: [String], format: 'binary' })
  @IsOptional()
  @IsArray()
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