import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { ListingResponseDto } from '../../listings/dto/listing.dto';

export class CreateFavoriteDto {
  @ApiProperty({
    description: 'The ID of the listing to favorite',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  listingId: string;
}

export class FavoriteResponseDto {
  @ApiProperty({
    description: 'The unique identifier for the favorite',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The listing that was favorited',
    type: () => ListingResponseDto,
  })
  listing: ListingResponseDto;

  @ApiProperty({
    description: 'The date when the favorite was created',
    example: '2024-03-20T15:30:00.000Z',
  })
  createdAt: Date;
} 