import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { Publication } from '../publications/entities/publication.entity';
import { User } from '../users/entities/user.entity';
import { CreateFavoriteDto } from './dto/favorite.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { FavoriteResponseDto } from './dto/favorite.dto'
import { ImageDto } from '../images/dto/image.dto';

@Injectable()
export class FavoritesService {
  private readonly logger = new Logger(FavoritesService.name);

  constructor(
    @InjectRepository(Favorite)
    private readonly favoritesRepository: Repository<Favorite>,
    @InjectRepository(Publication)
    private readonly publicationsRepository: Repository<Publication>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createFavoriteDto: CreateFavoriteDto, user: User): Promise<Favorite> {
    const publication = await this.publicationsRepository.findOne({
      where: { id: createFavoriteDto.publicationId },
      relations: ['seller'],
    });

    if (!publication) {
      throw new NotFoundException('Publication not found');
    }

    const existingFavorite = await this.favoritesRepository.findOne({
      where: {
        user: { id: user.id }, // Consulta correcta por ID
        publication: { id: publication.id }, // Consulta correcta por ID
      },
    });

    if (existingFavorite) {
      throw new ConflictException('Publication is already in favorites');
    }

    const favorite = this.favoritesRepository.create({
      user,
      publication,
    });

    const savedFavorite = await this.favoritesRepository.save(favorite);

    // Notify the publication owner *solo si* no es el mismo usuario
    if (publication.seller.id !== user.id) {
      await this.notificationsService.createNewFavoriteNotification(savedFavorite); //  Un solo argumento
    }

    return savedFavorite;
  }

    async findAll(user: User): Promise<Favorite[]> {
        return this.favoritesRepository.find({
            where: { user: { id: user.id } }, //  consulta por ID
            relations: ['publication', 'publication.seller', 'publication.categories'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string, user: User): Promise<Favorite> {
        const favorite = await this.favoritesRepository.findOne({
            where: { id, user: { id: user.id } }, //  consulta por ID
            relations: ['publication', 'publication.seller', 'publication.categories'],
        });

        if (!favorite) {
            throw new NotFoundException('Favorite not found');
        }

        return favorite;
    }

  async remove(id: string, user: User): Promise<void> {
    const favorite = await this.findOne(id, user); // Ya comprueba el usuario
    await this.favoritesRepository.remove(favorite);
  }

  async removeAll(user: User): Promise<void> {
    // No es necesario buscar primero, se puede eliminar directamente
    await this.favoritesRepository.delete({ user: { id: user.id } });
  }

    async mapToResponseDto(favorite: Favorite): Promise<FavoriteResponseDto> {
        return {
        id: favorite.id,
        publication: {
            ...favorite.publication,
            favorites: favorite.publication.favorites || 0,
            contact: {
                whatsapp: favorite.publication.contact.whatsapp || '',
                showEmail: favorite.publication.contact.showEmail ?? false,
                showPhone: favorite.publication.contact.showPhone ?? false,
            },
            images: favorite.publication.images.map((image: ImageDto) => ({
                url: image.url,
                key: image.key,
                bucket: image.bucket,
                mimeType: image.mimeType,
                publicationId: image.publicationId,
                order: image.order,
                alt: image.alt,
            })),
        },
        createdAt: favorite.createdAt
        }
    }

  async toggleFavorite(createFavoriteDto: CreateFavoriteDto, userId: string): Promise<void> {
    const existing = await this.favoritesRepository.findOne({
      where: {
        publication: { id: createFavoriteDto.publicationId },
        user: { id: userId },
      },
    });

    if (existing) {
      await this.favoritesRepository.remove(existing);
    } else {
      const favorite = this.favoritesRepository.create({
        publication: { id: createFavoriteDto.publicationId },
        user: { id: userId },
      });
      await this.favoritesRepository.save(favorite);
    }
  }
}