import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
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
import { Favorite } from './entities/favorite.entity';

@ApiTags('favorites')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':productId')
  @ApiOperation({ summary: 'Add a product to favorites' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({
    status: 201,
    description: 'The product has been added to favorites.',
  })
  async addFavorite(
    @Param('productId') productId: string,
    @Request() req,
  ): Promise<Favorite> {
    return this.favoritesService.addFavorite(productId, req.user);
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Remove a product from favorites' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'The product has been removed from favorites.',
  })
  async removeFavorite(
    @Param('productId') productId: string,
    @Request() req,
  ): Promise<void> {
    return this.favoritesService.removeFavorite(productId, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get user favorites' })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of user favorites',
  })
  async getUserFavorites(@Request() req): Promise<Favorite[]> {
    return this.favoritesService.getUserFavorites(req.user.id);
  }

  @Get(':productId/check')
  @ApiOperation({ summary: 'Check if a product is in user favorites' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns true if the product is in favorites',
  })
  async checkIsFavorite(
    @Param('productId') productId: string,
    @Request() req,
  ): Promise<{ isFavorite: boolean }> {
    const isFavorite = await this.favoritesService.checkIsFavorite(
      productId,
      req.user.id,
    );
    return { isFavorite };
  }
} 