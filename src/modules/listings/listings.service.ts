import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan } from 'typeorm';
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
    const slug = this.generateSlug(quickListingDto.title);

    // Validate required fields
    if (!quickListingDto.title || quickListingDto.title.length < 5) {
      throw new BadRequestException('El título debe tener al menos 5 caracteres');
    }

    if (!quickListingDto.description || quickListingDto.description.length < 20) {
      throw new BadRequestException('La descripción debe tener al menos 20 caracteres');
    }

    if (!quickListingDto.contact?.whatsapp || !/^\d{9,}$/.test(quickListingDto.contact.whatsapp)) {
      throw new BadRequestException('El número de WhatsApp debe tener al menos 9 dígitos');
    }

    // Handle media files
    let mediaUrls: string[] = [];
    if (quickListingDto.media && quickListingDto.media.length > 0) {
      try {
        mediaUrls = await Promise.all(
          quickListingDto.media.map(file => this.storageService.uploadFile(file))
        );
      } catch (error) {
        throw new BadRequestException('Error al subir las imágenes. Por favor intenta de nuevo.');
      }
    }

    // Set expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const listing = this.listingRepository.create({
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
      status: ListingStatus.ACTIVE,
      publishedAt: new Date(),
      expiresAt,
      isActive: true,
      isVerified: false,
      isFeatured: false,
      isUrgent: false,
    });

    try {
      const savedListing = await this.listingRepository.save(listing);
      await this.indexListing(savedListing);
      return savedListing;
    } catch (error) {
      // Clean up uploaded files if saving fails
      if (mediaUrls.length > 0) {
        await Promise.all(
          mediaUrls.map(url => this.storageService.deleteFile(url))
        );
      }
      throw new BadRequestException('Error al guardar el anuncio. Por favor intenta de nuevo.');
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
    const {
      query,
      type,
      status,
      categoryId,
      ownerId,
      minPrice,
      maxPrice,
      location,
      city,
      state,
      country,
      isFeatured,
      isVerified,
      isUrgent,
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
    } = searchDto;

    const must: any[] = [{ term: { isActive: true } }];
    const filter: any[] = [];

    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['title^2', 'description'],
          fuzziness: 'AUTO',
        },
      });
    }

    if (type) {
      filter.push({ term: { type } });
    }

    if (status) {
      filter.push({ term: { status } });
    }

    if (categoryId) {
      filter.push({ term: { categoryIds: categoryId } });
    }

    if (ownerId) {
      filter.push({ term: { ownerId } });
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const range: any = {};
      if (minPrice !== undefined) range.gte = minPrice;
      if (maxPrice !== undefined) range.lte = maxPrice;
      filter.push({ range: { price: range } });
    }

    if (city) {
      filter.push({ term: { 'location.city': city } });
    }

    if (state) {
      filter.push({ term: { 'location.state': state } });
    }

    if (country) {
      filter.push({ term: { 'location.country': country } });
    }

    if (isFeatured !== undefined) {
      filter.push({ term: { isFeatured } });
    }

    if (isVerified !== undefined) {
      filter.push({ term: { isVerified } });
    }

    if (isUrgent !== undefined) {
      filter.push({ term: { isUrgent } });
    }

    const body: any = {
      from: (page - 1) * limit,
      size: limit,
      query: {
        bool: {
          must,
          filter,
        },
      },
      sort: [{ [sort]: { order } }],
    };

    if (location) {
      body.query.bool.filter.push({
        geo_distance: {
          distance: `${location.radius}km`,
          'location.coordinates': {
            lat: location.latitude,
            lon: location.longitude,
          },
        },
      });

      body.sort.unshift({
        _geo_distance: {
          'location.coordinates': {
            lat: location.latitude,
            lon: location.longitude,
          },
          order: 'asc',
          unit: 'km',
        },
      });
    }

    const { body: response } = await this.elasticsearchService.search({
      index: this.indexName,
      body,
    });

    const hits = response.hits.hits;
    const total = response.hits.total.value;

    const items = await Promise.all(
      hits.map(async (hit: any) => {
        const listing = await this.findOne(hit._source.id);
        return {
          ...this.mapToResponseDto(listing),
          distance: hit.sort?.[0],
          relevanceScore: hit._score,
        };
      }),
    );

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
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

