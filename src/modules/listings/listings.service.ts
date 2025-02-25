import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan, Like, FindOptionsWhere } from 'typeorm';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import * as slugify from 'slugify';
import { Listing, ListingStatus } from './entities/listing.entity';
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import { StorageService } from '../storage/storage.service';
import {
  QuickListingDto,
  CreateListingDto,
  UpdateListingDto,
  SearchListingDto,
  ListingResponseDto,
} from './dto/listing.dto';

@Injectable()
export class ListingsService {
  private readonly indexName = 'listings';

  constructor(
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly elasticsearchService: ElasticsearchService,
    private readonly storageService: StorageService,
  ) {
    this.createIndex();
  }

  private async createIndex() {
    const checkIndex = await this.elasticsearchService.indices.exists({
      index: this.indexName,
    });

    if (!checkIndex) {
      await this.elasticsearchService.indices.create({
        index: this.indexName,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              title: { type: 'text' },
              slug: { type: 'keyword' },
              description: { type: 'text' },
              type: { type: 'keyword' },
              price: { type: 'float' },
              priceType: { type: 'keyword' },
              status: { type: 'keyword' },
              location: {
                type: 'geo_point',
                properties: {
                  coordinates: { type: 'geo_point' },
                  address: { type: 'text' },
                  city: { type: 'keyword' },
                  state: { type: 'keyword' },
                  country: { type: 'keyword' },
                },
              },
              categoryIds: { type: 'keyword' },
              ownerId: { type: 'keyword' },
              isActive: { type: 'boolean' },
              isFeatured: { type: 'boolean' },
              isVerified: { type: 'boolean' },
              isUrgent: { type: 'boolean' },
              createdAt: { type: 'date' },
              publishedAt: { type: 'date' },
              expiresAt: { type: 'date' },
            },
          },
        },
      });
    }
  }

  async createQuick(
    quickListingDto: QuickListingDto,
    owner: User,
  ): Promise<Listing> {
    try {
      const slug = this.generateSlug(quickListingDto.title);

      // Validaciones mínimas
      if (!quickListingDto.title) {
        throw new BadRequestException('El título es requerido');
      }
      if (!quickListingDto.description) {
        throw new BadRequestException('La descripción es requerida');
      }
      if (!quickListingDto.contact?.whatsapp) {
        throw new BadRequestException('El número de WhatsApp es requerido');
      }

      // Handle media files if present
      let mediaUrls: string[] = [];
      if (quickListingDto.media?.length > 0) {
        try {
          mediaUrls = await Promise.all(
            quickListingDto.media.map(file => this.storageService.uploadFile(file))
          );
        } catch (error) {
          console.error('Error uploading media:', error);
          // Continue without media if upload fails
        }
      }

      // Set expiration date (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const listing = await this.listingRepository.save({
        title: quickListingDto.title,
        description: quickListingDto.description,
        slug,
        owner,
        type: quickListingDto.type,
        category: quickListingDto.category,
        contact: quickListingDto.contact,
        location: quickListingDto.location,
        price: quickListingDto.price,
        media: mediaUrls.map((url, index) => ({
          url,
          order: index,
          isPrimary: index === 0
        })),
        status: 'ACTIVE',
        publishedAt: new Date(),
        expiresAt,
        isActive: true,
        isVerified: false,
        isFeatured: false,
        isUrgent: false,
      });

      // Index the listing if elasticsearch is available
      try {
        await this.indexListing(listing);
      } catch (error) {
        console.error('Error indexing listing:', error);
        // Continue even if indexing fails
      }

      return listing;
    } catch (error) {
      console.error('Error in createQuick:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        error.message || 'Error al crear el anuncio. Por favor intenta de nuevo.'
      );
    }
  }

  private generateSlug(title: string): string {
    const baseSlug = slugify(title, { lower: true, strict: true });
    const timestamp = Date.now();
    return `${baseSlug}-${timestamp}`;
  }

  async create(createListingDto: CreateListingDto, seller: User): Promise<Listing> {
    const slug = slugify(createListingDto.title, { lower: true });
    
    const existingListing = await this.listingRepository.findOne({
      where: { slug },
    });

    if (existingListing) {
      const timestamp = Date.now();
      const uniqueSlug = `${slug}-${timestamp}`;
      const listing = this.listingRepository.create({
        ...createListingDto,
        slug: uniqueSlug,
        seller,
      });
      return this.listingRepository.save(listing);
    }

    const listing = this.listingRepository.create({
      ...createListingDto,
      slug,
      seller,
    });

    return this.listingRepository.save(listing);
  }

  async findAll(): Promise<Listing[]> {
    return this.listingRepository.find({
      where: {
        isActive: true,
        status: ListingStatus.ACTIVE,
        expiresAt: MoreThan(new Date()),
      },
      order: {
        isFeatured: 'DESC',
        isUrgent: 'DESC',
        publishedAt: 'DESC',
      },
      relations: ['owner', 'category'],
    });
  }

  async findOne(id: string): Promise<Listing> {
    const listing = await this.listingRepository.findOne({
      where: { id },
      relations: ['owner', 'category'],
    });

    if (!listing) {
      throw new NotFoundException('Anuncio no encontrado');
    }

    if (!listing.isActive || listing.status !== ListingStatus.ACTIVE || listing.expiresAt < new Date()) {
      throw new NotFoundException('Este anuncio ya no está disponible');
    }

    return listing;
  }

  async update(
    id: string,
    updateListingDto: UpdateListingDto,
    user: User,
  ): Promise<Listing> {
    const listing = await this.findOne(id);

    if (listing.seller.id !== user.id) {
      throw new ForbiddenException('You can only update your own listings');
    }

    if (updateListingDto.title) {
      const newSlug = slugify(updateListingDto.title, { lower: true });
      const existingListing = await this.listingRepository.findOne({
        where: { slug: newSlug },
      });

      if (existingListing && existingListing.id !== id) {
        const timestamp = Date.now();
        updateListingDto['slug'] = `${newSlug}-${timestamp}`;
      } else {
        updateListingDto['slug'] = newSlug;
      }
    }

    if (updateListingDto.status === ListingStatus.PUBLISHED && !listing.publishedAt) {
      updateListingDto['publishedAt'] = new Date();
    }

    Object.assign(listing, updateListingDto);
    const updatedListing = await this.listingRepository.save(listing);
    await this.indexListing(updatedListing);

    return updatedListing;
  }

  async remove(id: string, user: User): Promise<void> {
    const listing = await this.findOne(id);

    if (listing.seller.id !== user.id) {
      throw new ForbiddenException('You can only delete your own listings');
    }

    await this.listingRepository.remove(listing);
    await this.elasticsearchService.delete({
      index: this.indexName,
      id,
    });
  }

  async search(searchDto: SearchListingDto) {
    const where: FindOptionsWhere<Listing> = {
      isActive: true,
      status: ListingStatus.ACTIVE,
    };

    // Búsqueda por texto
    if (searchDto.query) {
      where.title = Like(`%${searchDto.query}%`);
    }

    // Filtro por categoría
    if (searchDto.categoryId) {
      where.category = { id: searchDto.categoryId };
    }

    // Filtro por ubicación
    if (searchDto.location?.district) {
      where.location = {
        district: searchDto.location.district,
        region: searchDto.location.region,
      };
    }

    // Filtro por rango de precios
    if (searchDto.price?.min || searchDto.price?.max) {
      where.price = {};
      if (searchDto.price.min) {
        where.price.amount = searchDto.price.min;
      }
      if (searchDto.price.max) {
        where.price.amount = searchDto.price.max;
      }
    }

    const [items, total] = await this.listingRepository.findAndCount({
      where,
      order: {
        isFeatured: 'DESC',
        isUrgent: 'DESC',
        createdAt: 'DESC',
      },
      skip: (searchDto.page - 1) * searchDto.limit,
      take: searchDto.limit,
      relations: ['owner', 'category'],
    });

    return {
      items,
      total,
      page: searchDto.page,
      limit: searchDto.limit,
      pages: Math.ceil(total / searchDto.limit),
    };
  }

  private async indexListing(listing: Listing) {
    const document = {
      id: listing.id,
      title: listing.title,
      slug: listing.slug,
      description: listing.description,
      type: listing.type,
      price: listing.price,
      priceType: listing.priceType,
      status: listing.status,
      location: listing.location
        ? {
            ...listing.location,
            coordinates: {
              lat: listing.location.coordinates.latitude,
              lon: listing.location.coordinates.longitude,
            },
          }
        : undefined,
      categoryIds: listing.categories.map(c => c.id),
      ownerId: listing.seller.id,
      isActive: listing.isActive,
      isFeatured: listing.isFeatured,
      isVerified: listing.isVerified,
      isUrgent: listing.isUrgent,
      createdAt: listing.createdAt,
      publishedAt: listing.publishedAt,
      expiresAt: listing.expiresAt,
    };

    await this.elasticsearchService.index({
      index: this.indexName,
      id: listing.id,
      body: document,
    });
  }

  private mapToResponseDto(listing: Listing): ListingResponseDto {
    const { seller, ...listingData } = listing;
    return {
      ...listingData,
      seller: {
        id: seller.id,
        firstName: seller.firstName,
        lastName: seller.lastName,
        email: seller.email,
      },
    };
  }
} 

