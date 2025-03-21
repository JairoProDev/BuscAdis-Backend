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
import { Publication, PublicationStatus } from './entities/publication.entity';
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import { StorageService } from '../storage/storage.service';
import { ImagesService } from '../images/images.service';
import {
  QuickPublicationDto,
  CreatePublicationDto,
  UpdatePublicationDto,
  SearchPublicationDto,
  PublicationResponseDto,
} from './dto/publication.dto';
import { Cache } from 'cache-manager';
import slugify from 'slugify';
import { ImageDto } from '../images/dto/image.dto';
import { ContactDto } from './dto/contact.dto';
import { LocationDto } from './dto/location.dto';
import { Image } from '../images/entities/image.entity';
import { PublicationStatus as PublicationStatusType } from './types/publication.types';

@Injectable()
export class PublicationsService {
  private readonly logger = new Logger(PublicationsService.name);

  constructor(
    @InjectRepository(Publication)
    private readonly publicationRepository: Repository<Publication>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly storageService: StorageService,
    private readonly imagesService: ImagesService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async initialize(): Promise<void> {
    // Implement any initialization logic here
    this.logger.log('PublicationsService initialized');
  }

  async createQuick(quickPublicationDto: QuickPublicationDto, owner: User): Promise<Publication> {
    try {
      // Validaciones de datos
      this.validatePublicationData(quickPublicationDto);
      
      // Validar imágenes
      if (quickPublicationDto.images) {
        const images = quickPublicationDto.images.map(img => {
          const image = new Image();
          Object.assign(image, img);
          return image;
        });
        await this.imagesService.validateImages(images);
      }

      // Validar categorías
      const categories = await this.validateCategories(quickPublicationDto.categoryIds);

      // Crear el listado
      const publication = await this.publicationRepository.save({
        ...this.preparePublicationData(quickPublicationDto, owner),
        categories,
      });

      return publication;
    } catch (error) {
      this.handlePublicationError(error);
    }
  }

  private validatePublicationData(data: QuickPublicationDto) {
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

  async create(createPublicationDto: CreatePublicationDto, seller: User): Promise<Publication> {
    try {
      const slug = this.generateSlug(createPublicationDto.title);
      const categories = await this.categoryRepository.findByIds(createPublicationDto.categoryIds);

      const publication = this.publicationRepository.create({
        ...createPublicationDto,
        slug,
        seller,  //  seller
        categories, //  categories (plural)
        status: createPublicationDto.status || PublicationStatusType.ACTIVE, //  status, con valor por defecto
        publishedAt: new Date(),
      });

      const savedPublication = await this.publicationRepository.save(publication);
      return savedPublication; // Devuelve la entidad
    } catch (error) {
      this.logger.error(`Error creating publication: ${(error as Error).message}`, (error as Error).stack);
      throw new BadRequestException((error as Error).message || 'Error al crear el anuncio');
    }
  }

  async findAll(): Promise<Publication[]> {
    // Intentar obtener del caché
    const cachedPublications = await this.cacheManager.get<Publication[]>('all_publications');
    if (cachedPublications) {
      return cachedPublications;
    }

    // Si no está en caché, obtener de la base de datos
    const publications = await this.publicationRepository.find({
      where: { isActive: true },
      relations: ['seller', 'categories'],
    });

    // Guardar en caché por 5 minutos
    await this.cacheManager.set('all_publications', publications, 300);

    return publications;
  }

  async findOne(id: string): Promise<Publication> {
    const publication = await this.publicationRepository.findOne({
      where: { id },
      relations: ['seller', 'categories'], //  'categories' en plural
    });

    if (!publication) {
      throw new NotFoundException('Anuncio no encontrado');
    }

    if (
      !publication.isActive ||
      publication.status !== PublicationStatusType.ACTIVE ||
      publication.expiresAt < new Date()
    ) {
      throw new NotFoundException('Este anuncio ya no está disponible');
    }

    return publication;
  }

  async update(id: string, updatePublicationDto: UpdatePublicationDto, user: User): Promise<Publication> {
    const publication = await this.findOne(id);

    if (publication.seller.id !== user.id) {
      throw new ForbiddenException('Solo puedes actualizar tus propios anuncios');
    }

    if (updatePublicationDto.title) {
      const newSlug = this.generateSlug(updatePublicationDto.title);
      const existingPublication = await this.publicationRepository.findOne({
        where: { slug: newSlug, id: Not(id) }, // Excluye el anuncio actual si tiene el mismo slug
      });

      if (existingPublication) {
        updatePublicationDto.slug = `${newSlug}-${Date.now()}`;
      } else {
        updatePublicationDto.slug = newSlug; // Use the new slug
      }
    }

    if(updatePublicationDto.categoryIds){
      const categories = await this.categoryRepository.findByIds(updatePublicationDto.categoryIds);
      publication.categories = categories;
    }

    if (updatePublicationDto.status === PublicationStatusType.PUBLISHED && !publication.publishedAt) {
      publication.publishedAt = new Date();
    }

    Object.assign(publication, updatePublicationDto);
    const updatedPublication = await this.publicationRepository.save(publication);
    return updatedPublication;
  }

  async remove(id: string, user: User): Promise<void> {
    const publication = await this.findOne(id);

    if (publication.seller.id !== user.id) {
      throw new ForbiddenException('Solo puedes eliminar tus propios anuncios');
    }

    await this.publicationRepository.remove(publication);
  }

  async search(searchDto: SearchPublicationDto) {
    try {
      const queryBuilder = this.publicationRepository.createQueryBuilder('publication')
        .leftJoinAndSelect('publication.categories', 'category')
        .leftJoinAndSelect('publication.seller', 'seller')
        .where('publication.isActive = :isActive', { isActive: true });

      // Aplicar filtros
      if (searchDto.query) {
        queryBuilder.andWhere(
          '(LOWER(publication.title) LIKE LOWER(:query) OR LOWER(publication.description) LIKE LOWER(:query))',
          { query: `%${searchDto.query}%` }
        );
      }

      // Agregar índices para mejorar el rendimiento
      await this.publicationRepository.query(`
        CREATE INDEX IF NOT EXISTS idx_publication_title ON publications (title);
        CREATE INDEX IF NOT EXISTS idx_publication_description ON publications (description);
        CREATE INDEX IF NOT EXISTS idx_publication_price ON publications (price);
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

  mapToResponseDto(publication: Publication): PublicationResponseDto {
    const { seller, categories, images, ...publicationData } = publication;

    return {
      ...publicationData,
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
        publicationId: image.publicationId,
        order: image.order,
        alt: image.alt,
      })) : [],
      favorites: publication.favorites || 0,
      contact: {
        whatsapp: publication.contact.whatsapp || '',
        email: publication.contact.email,
        phone: publication.contact.phone,
        showEmail: publication.contact.showEmail,
        showPhone: publication.contact.showPhone,
      },
    };
  }

  async createPublication(publicationData: Partial<Publication>): Promise<Publication> {
    const publication = this.publicationRepository.create(publicationData);
    return this.publicationRepository.save(publication);
  }

  async searchPublications(query: string): Promise<Publication[]> {
    return this.publicationRepository.createQueryBuilder('publication')
      .where('publication.title ILIKE :query OR publication.description ILIKE :query', { query: `%${query}%` })
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

  private preparePublicationData(dto: QuickPublicationDto, owner: User): Partial<Publication> {
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
      status: PublicationStatusType.ACTIVE,
      publishedAt: new Date(),
      expiresAt,
      isActive: true,
      isVerified: false,
      isFeatured: false,
      isUrgent: false,
    };
  }

  private handlePublicationError(error: any): never {
    this.logger.error('Error in publication operation:', error);
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new BadRequestException(error.message || 'Error en la operación');
  }
}