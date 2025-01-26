import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import slugify from 'slugify';
import { Listing, ListingStatus } from './entities/listing.entity';
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
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
    const slug = slugify(quickListingDto.title, { lower: true, strict: true });

    const existingListing = await this.listingRepository.findOne({
      where: { slug },
    });

    if (existingListing) {
      throw new ConflictException('Listing with this slug already exists');
    }

    // Get default category based on listing type
    const defaultCategory = await this.categoryRepository.findOne({
      where: { slug: quickListingDto.type },
    });

    if (!defaultCategory) {
      throw new NotFoundException('Default category not found');
    }

    const listing = this.listingRepository.create({
      ...quickListingDto,
      slug,
      owner,
      categories: [defaultCategory],
      status: ListingStatus.PUBLISHED,
      publishedAt: new Date(),
    });

    const savedListing = await this.listingRepository.save(listing);
    await this.indexListing(savedListing);

    return savedListing;
  }

  async create(createListingDto: CreateListingDto, owner: User): Promise<Listing> {
    const slug = createListingDto.slug ||
      slugify(createListingDto.title, { lower: true, strict: true });

    const existingListing = await this.listingRepository.findOne({
      where: { slug },
    });

    if (existingListing) {
      throw new ConflictException('Listing with this slug already exists');
    }

    const categories = await this.categoryRepository.findBy({
      id: In(createListingDto.categoryIds),
    });

    if (categories.length !== createListingDto.categoryIds.length) {
      throw new NotFoundException('Some categories not found');
    }

    const listing = this.listingRepository.create({
      ...createListingDto,
      slug,
      owner,
      categories,
      status: ListingStatus.PUBLISHED,
      publishedAt: new Date(),
    });

    const savedListing = await this.listingRepository.save(listing);
    await this.indexListing(savedListing);

    return savedListing;
  }

  async findAll(): Promise<Listing[]> {
    return this.listingRepository.find({
      where: { isActive: true, status: ListingStatus.PUBLISHED },
      relations: ['owner', 'categories'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Listing> {
    const listing = await this.listingRepository.findOne({
      where: { id },
      relations: ['owner', 'categories'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Increment views
    await this.listingRepository.increment({ id }, 'views', 1);

    return listing;
  }

  async update(
    id: string,
    updateListingDto: UpdateListingDto,
    user: User,
  ): Promise<Listing> {
    const listing = await this.findOne(id);

    if (listing.owner.id !== user.id) {
      throw new ForbiddenException('You can only update your own listings');
    }

    if (updateListingDto.categoryIds) {
      const categories = await this.categoryRepository.findBy({
        id: In(updateListingDto.categoryIds),
      });

      if (categories.length !== updateListingDto.categoryIds.length) {
        throw new NotFoundException('Some categories not found');
      }

      listing.categories = categories;
    }

    if (updateListingDto.title && !updateListingDto.slug) {
      updateListingDto.slug = slugify(updateListingDto.title, {
        lower: true,
        strict: true,
      });
    }

    if (updateListingDto.slug && updateListingDto.slug !== listing.slug) {
      const existingListing = await this.listingRepository.findOne({
        where: { slug: updateListingDto.slug },
      });

      if (existingListing && existingListing.id !== id) {
        throw new ConflictException('Listing with this slug already exists');
      }
    }

    Object.assign(listing, updateListingDto);

    if (updateListingDto.status === ListingStatus.PUBLISHED && !listing.publishedAt) {
      listing.publishedAt = new Date();
    }

    const updatedListing = await this.listingRepository.save(listing);
    await this.indexListing(updatedListing);

    return updatedListing;
  }

  async remove(id: string, user: User): Promise<void> {
    const listing = await this.findOne(id);

    if (listing.owner.id !== user.id) {
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
      ownerId: listing.owner.id,
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
    return {
      id: listing.id,
      title: listing.title,
      slug: listing.slug,
      description: listing.description,
      type: listing.type,
      price: listing.price,
      priceType: listing.priceType,
      status: listing.status,
      attributes: listing.attributes,
      images: listing.images,
      location: listing.location,
      contact: listing.contact,
      views: listing.views,
      likes: listing.likes,
      isActive: listing.isActive,
      isFeatured: listing.isFeatured,
      isVerified: listing.isVerified,
      isUrgent: listing.isUrgent,
      owner: {
        id: listing.owner.id,
        firstName: listing.owner.firstName,
        lastName: listing.owner.lastName,
        email: listing.owner.email,
      },
      categories: listing.categories.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
      })),
      metadata: listing.metadata,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
      publishedAt: listing.publishedAt,
      expiresAt: listing.expiresAt,
    };
  }
} 