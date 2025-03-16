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
import { Classifiedad, ClassifiedadStatus } from './entities/classifiedad.entity';
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import { StorageService } from '../storage/storage.service';
import { ImagesService } from '../images/images.service';
import {
  QuickClassifiedadDto,
  CreateClassifiedadDto,
  UpdateClassifiedadDto,
  SearchClassifiedadDto,
  ClassifiedadResponseDto,
} from './dto/classifiedad.dto';
import { Cache } from 'cache-manager';
import slugify from 'slugify';
import { ImageDto } from '../images/dto/image.dto';
import { ContactDto } from './dto/contact.dto';
import { LocationDto } from './dto/location.dto';
import { Image } from '../images/entities/image.entity';
import { ClassifiedadStatus as ClassifiedadStatusType } from './types/classifiedad.types';

@Injectable()
export class ClassifiedadsService {
  private readonly logger = new Logger(ClassifiedadsService.name);

  constructor(
    @InjectRepository(Classifiedad)
    private readonly classifiedadRepository: Repository<Classifiedad>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly storageService: StorageService,
    private readonly imagesService: ImagesService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async initialize(): Promise<void> {
    // Implement any initialization logic here
    this.logger.log('ClassifiedadsService initialized');
  }

  async createQuick(quickClassifiedadDto: QuickClassifiedadDto, owner: User): Promise<Classifiedad> {
    try {
      // Validaciones de datos
      this.validateClassifiedadData(quickClassifiedadDto);
      
      // Validar imágenes
      if (quickClassifiedadDto.images) {
        const images = quickClassifiedadDto.images.map(img => {
          const image = new Image();
          Object.assign(image, img);
          return image;
        });
        await this.imagesService.validateImages(images);
      }

      // Validar categorías
      const categories = await this.validateCategories(quickClassifiedadDto.categoryIds);

      // Crear el listado
      const classifiedad = await this.classifiedadRepository.save({
        ...this.prepareClassifiedadData(quickClassifiedadDto, owner),
        categories,
      });

      return classifiedad;
    } catch (error) {
      this.handleClassifiedadError(error);
    }
  }

  private validateClassifiedadData(data: QuickClassifiedadDto) {
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

  async create(createClassifiedadDto: CreateClassifiedadDto, seller: User): Promise<Classifiedad> {
    try {
      const slug = this.generateSlug(createClassifiedadDto.title);
      const categories = await this.categoryRepository.findByIds(createClassifiedadDto.categoryIds);

      const classifiedad = this.classifiedadRepository.create({
        ...createClassifiedadDto,
        slug,
        seller,  //  seller
        categories, //  categories (plural)
        status: createClassifiedadDto.status || ClassifiedadStatusType.ACTIVE, //  status, con valor por defecto
        publishedAt: new Date(),
      });

      const savedClassifiedad = await this.classifiedadRepository.save(classifiedad);
      return savedClassifiedad; // Devuelve la entidad
    } catch (error) {
      this.logger.error(`Error creating classifiedad: ${(error as Error).message}`, (error as Error).stack);
      throw new BadRequestException((error as Error).message || 'Error al crear el anuncio');
    }
  }

  async findAll(): Promise<Classifiedad[]> {
    // Intentar obtener del caché
    const cachedClassifiedads = await this.cacheManager.get<Classifiedad[]>('all_classifiedads');
    if (cachedClassifiedads) {
      return cachedClassifiedads;
    }

    // Si no está en caché, obtener de la base de datos
    const classifiedads = await this.classifiedadRepository.find({
      where: { isActive: true },
      relations: ['seller', 'categories'],
    });

    // Guardar en caché por 5 minutos
    await this.cacheManager.set('all_classifiedads', classifiedads, 300);

    return classifiedads;
  }

  async findOne(id: string): Promise<Classifiedad> {
    const classifiedad = await this.classifiedadRepository.findOne({
      where: { id },
      relations: ['seller', 'categories'], //  'categories' en plural
    });

    if (!classifiedad) {
      throw new NotFoundException('Anuncio no encontrado');
    }

    if (
      !classifiedad.isActive ||
      classifiedad.status !== ClassifiedadStatusType.ACTIVE ||
      classifiedad.expiresAt < new Date()
    ) {
      throw new NotFoundException('Este anuncio ya no está disponible');
    }

    return classifiedad;
  }

  async update(id: string, updateClassifiedadDto: UpdateClassifiedadDto, user: User): Promise<Classifiedad> {
    const classifiedad = await this.findOne(id);

    if (classifiedad.seller.id !== user.id) {
      throw new ForbiddenException('Solo puedes actualizar tus propios anuncios');
    }

    if (updateClassifiedadDto.title) {
      const newSlug = this.generateSlug(updateClassifiedadDto.title);
      const existingClassifiedad = await this.classifiedadRepository.findOne({
        where: { slug: newSlug, id: Not(id) }, // Excluye el anuncio actual si tiene el mismo slug
      });

      if (existingClassifiedad) {
        updateClassifiedadDto.slug = `${newSlug}-${Date.now()}`;
      } else {
        updateClassifiedadDto.slug = newSlug; // Use the new slug
      }
    }

    if(updateClassifiedadDto.categoryIds){
      const categories = await this.categoryRepository.findByIds(updateClassifiedadDto.categoryIds);
      classifiedad.categories = categories;
    }

    if (updateClassifiedadDto.status === ClassifiedadStatusType.PUBLISHED && !classifiedad.publishedAt) {
      classifiedad.publishedAt = new Date();
    }

    Object.assign(classifiedad, updateClassifiedadDto);
    const updatedClassifiedad = await this.classifiedadRepository.save(classifiedad);
    return updatedClassifiedad;
  }

  async remove(id: string, user: User): Promise<void> {
    const classifiedad = await this.findOne(id);

    if (classifiedad.seller.id !== user.id) {
      throw new ForbiddenException('Solo puedes eliminar tus propios anuncios');
    }

    await this.classifiedadRepository.remove(classifiedad);
  }

  async search(searchDto: SearchClassifiedadDto) {
    try {
      const queryBuilder = this.classifiedadRepository.createQueryBuilder('classifiedad')
        .leftJoinAndSelect('classifiedad.categories', 'category')
        .leftJoinAndSelect('classifiedad.seller', 'seller')
        .where('classifiedad.isActive = :isActive', { isActive: true });

      // Aplicar filtros
      if (searchDto.query) {
        queryBuilder.andWhere(
          '(LOWER(classifiedad.title) LIKE LOWER(:query) OR LOWER(classifiedad.description) LIKE LOWER(:query))',
          { query: `%${searchDto.query}%` }
        );
      }

      // Agregar índices para mejorar el rendimiento
      await this.classifiedadRepository.query(`
        CREATE INDEX IF NOT EXISTS idx_classifiedad_title ON classifiedads (title);
        CREATE INDEX IF NOT EXISTS idx_classifiedad_description ON classifiedads (description);
        CREATE INDEX IF NOT EXISTS idx_classifiedad_price ON classifiedads (price);
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

  mapToResponseDto(classifiedad: Classifiedad): ClassifiedadResponseDto {
    const { seller, categories, images, ...classifiedadData } = classifiedad;

    return {
      ...classifiedadData,
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
        classifiedadId: image.classifiedadId,
        order: image.order,
        alt: image.alt,
      })) : [],
      favorites: classifiedad.favorites || 0,
      contact: {
        whatsapp: classifiedad.contact.whatsapp || '',
        email: classifiedad.contact.email,
        phone: classifiedad.contact.phone,
        showEmail: classifiedad.contact.showEmail,
        showPhone: classifiedad.contact.showPhone,
      },
    };
  }

  async createClassifiedad(classifiedadData: Partial<Classifiedad>): Promise<Classifiedad> {
    const classifiedad = this.classifiedadRepository.create(classifiedadData);
    return this.classifiedadRepository.save(classifiedad);
  }

  async searchClassifiedads(query: string): Promise<Classifiedad[]> {
    return this.classifiedadRepository.createQueryBuilder('classifiedad')
      .where('classifiedad.title ILIKE :query OR classifiedad.description ILIKE :query', { query: `%${query}%` })
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

  private prepareClassifiedadData(dto: QuickClassifiedadDto, owner: User): Partial<Classifiedad> {
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
      status: ClassifiedadStatusType.ACTIVE,
      publishedAt: new Date(),
      expiresAt,
      isActive: true,
      isVerified: false,
      isFeatured: false,
      isUrgent: false,
    };
  }

  private handleClassifiedadError(error: any): never {
    this.logger.error('Error in classifiedad operation:', error);
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new BadRequestException(error.message || 'Error en la operación');
  }
}