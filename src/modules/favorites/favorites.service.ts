import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { Listing } from '../listings/entities/listing.entity';
import { User } from '../users/entities/user.entity';
import { CreateFavoriteDto } from './dto/favorite.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoritesRepository: Repository<Favorite>,
    @InjectRepository(Listing)
    private readonly listingsRepository: Repository<Listing>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createFavoriteDto: CreateFavoriteDto, user: User): Promise<Favorite> {
    const listing = await this.listingsRepository.findOne({
      where: { id: createFavoriteDto.listingId },
      relations: ['seller'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const existingFavorite = await this.favoritesRepository.findOne({
      where: {
        user: { id: user.id },
        listing: { id: listing.id },
      },
    });

    if (existingFavorite) {
      throw new ConflictException('Listing is already in favorites');
    }

    const favorite = this.favoritesRepository.create({
      user,
      listing,
    });

    await this.favoritesRepository.save(favorite);

    // Notify the listing owner
    if (listing.seller.id !== user.id) {
      await this.notificationsService.createNewFavoriteNotification(
        listing.seller,
        user,
        listing,
      );
    }

    return favorite;
  }

  async findAll(user: User): Promise<Favorite[]> {
    return this.favoritesRepository.find({
      where: { user: { id: user.id } },
      relations: ['listing', 'listing.seller', 'listing.categories'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user: User): Promise<Favorite> {
    const favorite = await this.favoritesRepository.findOne({
      where: { id, user: { id: user.id } },
      relations: ['listing', 'listing.seller', 'listing.categories'],
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    return favorite;
  }

  async remove(id: string, user: User): Promise<void> {
    const favorite = await this.findOne(id, user);
    await this.favoritesRepository.remove(favorite);
  }

  async removeAll(user: User): Promise<void> {
    const favorites = await this.favoritesRepository.find({
      where: { user: { id: user.id } },
    });
    await this.favoritesRepository.remove(favorites);
  }

  async mapToResponseDto(favorite: Favorite) {
    return {
      id: favorite.id,
      listing: favorite.listing,
      createdAt: favorite.createdAt,
    };
  }
} 