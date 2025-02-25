import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto, FavoriteResponseDto } from './dto/favorite.dto';
import { AuthenticatedRequest } from '../../common/types/request.type';

@ApiTags('favorites')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':listingId')
  @ApiOperation({ summary: 'Add a listing to favorites' })
  @ApiResponse({
    status: 201,
    description: 'The listing has been successfully added to favorites.',
    type: FavoriteResponseDto,
  })
  async create(
    @Param('listingId') listingId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<FavoriteResponseDto> {
    const favorite = await this.favoritesService.create(listingId, req.user);
    return this.favoritesService.mapToResponseDto(favorite);
  }

  @Get()
  @ApiOperation({ summary: 'Get all favorites' })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of favorites',
    type: [FavoriteResponseDto],
  })
  async findAll(@Request() req: AuthenticatedRequest): Promise<FavoriteResponseDto[]> {
    const favorites = await this.favoritesService.findAll(req.user);
    return Promise.all(favorites.map(favorite => 
      this.favoritesService.mapToResponseDto(favorite)
    ));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a favorite by id' })
  @ApiParam({ name: 'id', description: 'Favorite ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the favorite',
    type: FavoriteResponseDto,
  })
  async findOne(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<FavoriteResponseDto> {
    const favorite = await this.favoritesService.findOne(id, req.user);
    return this.favoritesService.mapToResponseDto(favorite);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a listing from favorites' })
  @ApiParam({ name: 'id', description: 'Favorite ID' })
  @ApiResponse({
    status: 200,
    description: 'The listing has been successfully removed from favorites.',
  })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.favoritesService.remove(id, req.user);
  }

  @Delete()
  @ApiOperation({ summary: 'Remove all favorites' })
  @ApiResponse({
    status: 200,
    description: 'All favorites have been successfully removed.',
  })
  async removeAll(@Request() req): Promise<void> {
    return this.favoritesService.removeAll(req.user);
  }
} 