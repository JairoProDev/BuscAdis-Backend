import { IsString, IsOptional, IsBoolean, IsUUID, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Electronics' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'electronics' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'Electronic devices and accessories' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'fa-microchip' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: 'https://example.com/electronics.jpg' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class UpdateCategoryDto extends CreateCategoryDto {
  @ApiPropertyOptional({ example: 'Electronics' })
  @IsOptional()
  @IsString()
  name?: string;
}

export class CategoryTreeDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  icon?: string;

  @ApiPropertyOptional()
  image?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ type: () => [CategoryTreeDto] })
  children?: CategoryTreeDto[];
}

export class MoveCategoryDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  newParentId: string;
} 