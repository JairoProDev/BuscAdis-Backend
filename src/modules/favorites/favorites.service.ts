import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepository: Repository<Favorite>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async addFavorite(productId: string, user: User): Promise<Favorite> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existingFavorite = await this.favoriteRepository.findOne({
      where: {
        user: { id: user.id },
        product: { id: productId },
      },
    });

    if (existingFavorite) {
      throw new ConflictException('Product is already in favorites');
    }

    // Increment product likes count
    await this.productRepository.increment({ id: productId }, 'likes', 1);

    const favorite = this.favoriteRepository.create({
      user,
      product,
    });

    return this.favoriteRepository.save(favorite);
  }

  async removeFavorite(productId: string, user: User): Promise<void> {
    const favorite = await this.favoriteRepository.findOne({
      where: {
        user: { id: user.id },
        product: { id: productId },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    // Decrement product likes count
    await this.productRepository.decrement({ id: productId }, 'likes', 1);

    await this.favoriteRepository.remove(favorite);
  }

  async getUserFavorites(userId: string): Promise<Favorite[]> {
    return this.favoriteRepository.find({
      where: { user: { id: userId } },
      relations: ['product', 'product.seller', 'product.categories'],
    });
  }

  async checkIsFavorite(productId: string, userId: string): Promise<boolean> {
    const favorite = await this.favoriteRepository.findOne({
      where: {
        user: { id: userId },
        product: { id: productId },
      },
    });

    return !!favorite;
  }
} 