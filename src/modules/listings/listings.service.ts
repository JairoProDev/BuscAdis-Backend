import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan, LessThan, Like, FindOptionsWhere, Between, LessThanOrEqual, MoreThanOrEqual, Not } from 'typeorm';
import { Listing, ListingStatus } from './entities/listing.entity';
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import { StorageService } from '../storage/storage.service';
import { ImagesService } from '../images/images.service';
import {
  QuickListingDto,
  CreateListingDto,
  UpdateListingDto,
  SearchListingDto,
  ListingResponseDto,
} from './dto/listing.dto';
import { Cache } from 'cache-manager';
import slugify from 'slugify';
import { ImageDto } from '../images/dto/image.dto';
import { ContactDto } from './dto/contact.dto';
import { LocationDto } from './dto/location.dto';
import { Image } from '../images/entities/image.entity';
import { ListingStatus as ListingStatusType } from './types/listing.types';

@Injectable()
export class ListingsService {
  private readonly logger = new Logger(ListingsService.name);

  constructor(
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly storageService: StorageService,
    private readonly imagesService: ImagesService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async initialize(): Promise<void> {
    // Implement any initialization logic here
    this.logger.log('ListingsService initialized');
  }

  async createQuick(quickListingDto: QuickListingDto, owner: User): Promise<Listing> {
    try {
      // Validaciones de datos
      this.validateListingData(quickListingDto);
      
      // Validar imágenes
      if (quickListingDto.images) {
        const images = quickListingDto.images.map(img => {
          const image = new Image();
          Object.assign(image, img);
          return image;
        });
        await this.imagesService.validateImages(images);
      }

      // Validar categorías
      const categories = await this.validateCategories(quickListingDto.categoryIds);

      // Crear el listado
      const listing = await this.listingRepository.save({
        ...this.prepareListingData(quickListingDto, owner),
        categories,
      });

      return listing;
    } catch (error) {
      this.handleListingError(error);
    }
  }

  private validateListingData(data: QuickListingDto) {
    if (!data.title?.trim()) {
      throw new BadRequestException('El título es requerido');
    }
    if (!data.description?.trim()) {
      throw new BadRequestException('La descripción es requerida');
    }
    if (!data.contact?.whatsapp) {
      throw new BadRequestException('El número de WhatsApp es requerido');
    }
    if (data.price === undefined || data.price === null) {
      throw new BadRequestException('El precio es requerido');
    }
    if (!data.location) {
      throw new BadRequestException('La ubicación es requerida');
    }
  }

  private generateSlug(title: string): string {
    const baseSlug = slugify(title, { lower: true, strict: true });
    const timestamp = Date.now();
    return `${baseSlug}-${timestamp}`;
  }

  async create(createListingDto: CreateListingDto, seller: User): Promise<Listing> {
    try {
      const slug = this.generateSlug(createListingDto.title);
      const categories = await this.categoryRepository.findByIds(createListingDto.categoryIds);

      const listing = this.listingRepository.create({
        ...createListingDto,
        slug,
        seller,  //  seller
        categories, //  categories (plural)
        status: createListingDto.status || ListingStatusType.ACTIVE, //  status, con valor por defecto
        publishedAt: new Date(),
      });

      const savedListing = await this.listingRepository.save(listing);
      return savedListing; // Devuelve la entidad
    } catch (error) {
      this.logger.error(`Error creating listing: ${(error as Error).message}`, (error as Error).stack);
      throw new BadRequestException((error as Error).message || 'Error al crear el anuncio');
    }
  }

  async findAll(): Promise<Listing[]> {
    // Intentar obtener del caché
    const cachedListings = await this.cacheManager.get<Listing[]>('all_listings');
    if (cachedListings) {
      return cachedListings;
    }

    // Si no está en caché, obtener de la base de datos
    const listings = await this.listingRepository.find({
      where: { isActive: true },
      relations: ['seller', 'categories'],
    });

    // Guardar en caché por 5 minutos
    await this.cacheManager.set('all_listings', listings, 300);

    return listings;
  }

  async findOne(id: string): Promise<Listing> {
    const listing = await this.listingRepository.findOne({
      where: { id },
      relations: ['seller', 'categories'], //  'categories' en plural
    });

    if (!listing) {
      throw new NotFoundException('Anuncio no encontrado');
    }

    if (
      !listing.isActive ||
      listing.status !== ListingStatusType.ACTIVE ||
      listing.expiresAt < new Date()
    ) {
      throw new NotFoundException('Este anuncio ya no está disponible');
    }

    return listing;
  }

  async update(id: string, updateListingDto: UpdateListingDto, user: User): Promise<Listing> {
    const listing = await this.findOne(id);

    if (listing.seller.id !== user.id) {
      throw new ForbiddenException('Solo puedes actualizar tus propios anuncios');
    }

    if (updateListingDto.title) {
      const newSlug = this.generateSlug(updateListingDto.title);
      const existingListing = await this.listingRepository.findOne({
        where: { slug: newSlug, id: Not(id) }, // Excluye el anuncio actual si tiene el mismo slug
      });

      if (existingListing) {
        updateListingDto.slug = `${newSlug}-${Date.now()}`;
      } else {
        updateListingDto.slug = newSlug; // Use the new slug
      }
    }

    if(updateListingDto.categoryIds){
      const categories = await this.categoryRepository.findByIds(updateListingDto.categoryIds);
      listing.categories = categories;
    }

    if (updateListingDto.status === ListingStatusType.PUBLISHED && !listing.publishedAt) {
      listing.publishedAt = new Date();
    }

    Object.assign(listing, updateListingDto);
    const updatedListing = await this.listingRepository.save(listing);
    return updatedListing;
  }

  async remove(id: string, user: User): Promise<void> {
    const listing = await this.findOne(id);

    if (listing.seller.id !== user.id) {
      throw new ForbiddenException('Solo puedes eliminar tus propios anuncios');
    }

    await this.listingRepository.remove(listing);
  }

  async search(searchDto: SearchListingDto) {
    try {
      const queryBuilder = this.listingRepository.createQueryBuilder('listing')
        .leftJoinAndSelect('listing.categories', 'category')
        .leftJoinAndSelect('listing.seller', 'seller')
        .where('listing.isActive = :isActive', { isActive: true });

      // Aplicar filtros
      if (searchDto.query) {
        queryBuilder.andWhere(
          '(LOWER(listing.title) LIKE LOWER(:query) OR LOWER(listing.description) LIKE LOWER(:query))',
          { query: `%${searchDto.query}%` }
        );
      }

      // Agregar índices para mejorar el rendimiento
      await this.listingRepository.query(`
        CREATE INDEX IF NOT EXISTS idx_listing_title ON listings (title);
        CREATE INDEX IF NOT EXISTS idx_listing_description ON listings (description);
        CREATE INDEX IF NOT EXISTS idx_listing_price ON listings (price);
      `);

      const [items, total] = await queryBuilder.getManyAndCount();

      return {
        items: items.map(item => this.mapToResponseDto(item)),
        total,
        page: searchDto.page || 1,
        limit: searchDto.limit || 10,
        pages: Math.ceil(total / (searchDto.limit || 10))
      };
    } catch (error) {
      this.logger.error('Error in search:', error);
      throw new BadRequestException('Error al buscar listados');
    }
  }

  mapToResponseDto(listing: Listing): ListingResponseDto {
    const { seller, categories, images, ...listingData } = listing;

    return {
      ...listingData,
      seller: {
        id: seller.id,
        firstName: seller.firstName,
        lastName: seller.lastName,
        email: seller.email,
        role: seller.role,
        provider: seller.provider,
        isActive: seller.isActive,
        createdAt: seller.createdAt,
        updatedAt: seller.updatedAt,
        isVerified: seller.isVerified,
      },
      categories: categories ? categories.map(category => ({
        id: category.id,
        name: category.name,
      })) : [],
      images: images ? images.map(image => ({
        url: image.url,
        key: image.key,
        bucket: image.bucket,
        mimeType: image.mimeType,
        listingId: image.listingId,
        order: image.order,
        alt: image.alt,
      })) : [],
      favorites: listing.favorites || 0,
      contact: {
        whatsapp: listing.contact.whatsapp || '',
        email: listing.contact.email,
        phone: listing.contact.phone,
        showEmail: listing.contact.showEmail,
        showPhone: listing.contact.showPhone,
      },
    };
  }

  async createListing(listingData: Partial<Listing>): Promise<Listing> {
    const listing = this.listingRepository.create(listingData);
    return this.listingRepository.save(listing);
  }

  async searchListings(query: string): Promise<Listing[]> {
    return this.listingRepository.createQueryBuilder('listing')
      .where('listing.title ILIKE :query OR listing.description ILIKE :query', { query: `%${query}%` })
      .getMany();
  }

  private async validateImages(images?: ImageDto[]): Promise<void> {
    if (!images || !Array.isArray(images)) {
      return;
    }
    // Validar cada imagen
    for (const image of images) {
      if (!image.mimeType || !['image/jpeg', 'image/png', 'image/webp'].includes(image.mimeType)) {
        throw new BadRequestException('Formato de imagen no válido');
      }
      if (!image.alt) {
        image.alt = ''; // Asignar un valor por defecto si no se proporciona
      }
    }
  }

  private async validateCategories(categoryIds?: string[]): Promise<Category[]> {
    if (!categoryIds || !Array.isArray(categoryIds)) {
      return [];
    }
    
    const categories = await this.categoryRepository.findByIds(categoryIds);
    if (categories.length !== categoryIds.length) {
      throw new BadRequestException('Una o más categorías no existen');
    }
    return categories;
  }

  private prepareListingData(dto: QuickListingDto, owner: User): Partial<Listing> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    return {
      title: dto.title,
      description: dto.description,
      slug: this.generateSlug(dto.title),
      seller: owner,
      type: dto.type,
      contact: dto.contact,
      location: dto.location,
      price: dto.price,
      status: ListingStatusType.ACTIVE,
      publishedAt: new Date(),
      expiresAt,
      isActive: true,
      isVerified: false,
      isFeatured: false,
      isUrgent: false,
    };
  }

  private handleListingError(error: any): never {
    this.logger.error('Error in listing operation:', error);
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new BadRequestException(error.message || 'Error en la operación');
  }
}