// src/modules/favorites/dto/favorite.dto.ts
import { IsUUID, IsNotEmpty } from 'class-validator'; // Importa IsNotEmpty
import { ApiProperty } from '@nestjs/swagger';
import { PublicationResponseDto } from '../../publications/dto/publication.dto'; // Asegúrate que este DTO exista

export class CreateFavoriteDto {
  @ApiProperty({
    description: 'The ID of the publication to favorite',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty() //  Añade esta validación
  publicationId: string;
}

export class FavoriteResponseDto {
  @ApiProperty({
    description: 'The unique identifier for the favorite',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The publication that was favorited',
    type: () => PublicationResponseDto,
  })
  publication: PublicationResponseDto;

  @ApiProperty({
    description: 'The date when the favorite was created',
    example: '2024-03-20T15:30:00.000Z',
  })
  createdAt: Date;
}