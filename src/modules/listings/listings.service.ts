import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan, Like, FindOptionsWhere, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import slugify from 'slugify'; // Importación por defecto
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
import { SearchResponse } from '@elastic/elasticsearch/lib/api/types';


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

    if (!checkIndex.value) { // Cambiado .body por .value
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
                type: 'geo_point', // Esto creo que esta bien
                properties: { //Revisar
                  coordinates: { type: 'geo_point' }, //Revisar
                  address: { type: 'text' },
                  city: { type: 'keyword' },
                  state: { type: 'keyword' },
                  country: { type: 'keyword' },
                },
              },
              categoryIds: { type: 'keyword' },
              ownerId: { type: 'keyword' }, //Esto creo que no va
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
      const slug = this.generateSlug(quickListingDto.title ?? ''); // Ya es correcto, y manejo de nullish

      // Validaciones mínimas (ya las tienes, las dejo)
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
      if (quickListingDto.images?.length > 0) { // Usar images en lugar de media
        try {
          mediaUrls = await Promise.all(
            quickListingDto.images.map(file => this.storageService.uploadFile(file)),
          );
        } catch (error) {
          console.error('Error uploading media:', error);
          // Continue without media if upload fails
        }
      }

      // Set expiration date (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);


      // Buscar categorias basado en categoryIds.  Usamos el operador '|| []'
      // para manejar el caso donde categoryIds sea undefined.
        const categories = await this.categoryRepository.find({
            where: { id: In(quickListingDto.categoryIds || []) },
        });


      const listing = await this.listingRepository.save({
        title: quickListingDto.title,
        description: quickListingDto.description,
        slug,
        seller: owner, // Corregido:  la propiedad en Listing se llama 'seller'
        type: quickListingDto.type,
        categories: categories, // Asignar las categorias encontradas
        contact: quickListingDto.contact,
        location: quickListingDto.location,
        price: quickListingDto.price, //Ya viene de QuickListingDto
        images: mediaUrls.map((url, index) => ({ //Cambié media por images.
          url,
          order: index,
          isPrimary: index === 0, //Si quieres añadir isPrimary.
          alt: ''
        })),
        status: ListingStatus.ACTIVE,  // Usar el enum, no la cadena directamente
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
      //Si no quieres pasar el error completo, es preferible enviar solo el mensaje.
      throw new BadRequestException(
        (error as Error).message || 'Error al crear el anuncio.  Por favor intenta de nuevo.',
      );
    }
  }

  private generateSlug(title: string): string {
    const baseSlug = slugify(title, { lower: true, strict: true });
    const timestamp = Date.now();
    return `${baseSlug}-${timestamp}`;
  }

  async create(createListingDto: CreateListingDto, seller: User): Promise<Listing> {
    const slug = slugify(createListingDto.title ?? '', { lower: true }); // Ya es correcto, manejo de nullish

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
      relations: ['seller', 'category'], // Corregido: la relación se llama 'seller'
    });
  }

  async findOne(id: string): Promise<Listing> {
    const listing = await this.listingRepository.findOne({
      where: { id },
      relations: ['seller', 'category'], // Corregido: la relación se llama 'seller'
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
      const newSlug = slugify(updateListingDto.title, { lower: true }); // Ya es correcto
      const existingListing = await this.listingRepository.findOne({
        where: { slug: newSlug },
      });

      if (existingListing && existingListing.id !== id) {
        const timestamp = Date.now();
        // Usamos directamente la propiedad `slug` del DTO.
        updateListingDto.slug = `${newSlug}-${timestamp}`;
      } else {
         updateListingDto.slug = newSlug; //Asignar directamente a updateListingDto
      }
    }
    //Usar una interface para añadir publishedAt.
    interface UpdateListingDtoWithPublishedAt extends UpdateListingDto {
        publishedAt?: Date;
    }

    if (updateListingDto.status === ListingStatus.PUBLISHED && !listing.publishedAt) {
      // Usamos la interface.
        (updateListingDto as UpdateListingDtoWithPublishedAt).publishedAt = new Date();
    }

    Object.assign(listing, updateListingDto);
    const updatedListing = await this.listingRepository.save(listing);
    await this.indexListing(updatedListing); //Pasamos updatedListing, que es de tipo Listing.

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
  //Si no existe location, coordenadas no existe, si existe coordenadas, existe lat y lon.

    if (searchDto.location?.latitude && searchDto.location?.longitude)
    {
       //Ejemplo usando búsqueda por cercanía, ajusta según tu base de datos.

        const radiusInMeters = (searchDto.location.radius ?? 10) * 1000; //Valor por defecto.

        //Para usar la función `geoCircle` necesitas un plugin como `typeorm-extension`.
        // where.location = {
        //     $geoWithin: {
        //         $centerSphere: [[searchDto.location.longitude, searchDto.location.latitude], radiusInMeters / 6378100] //Radio de la tierra en metros.
        //     }
        // };
        //Para una búsqueda simple por rango:
        const lat = searchDto.location.latitude;
        const lon = searchDto.location.longitude;
        const range = 0.1; //Ajustar

        where.location = {
          coordinates: {
             lat: Between(lat - range, lat + range),
             lon: Between(lon - range, lon + range)
          }

        } as FindOptionsWhere<Listing>; //Aserción porque coordinates no matchea con el tipo esperado.


    }


    // Filtro por rango de precios
     if (searchDto.price?.min || searchDto.price?.max) {
        if (searchDto.price.min && searchDto.price.max) {
            where.price = Between(searchDto.price.min, searchDto.price.max);
        } else if (searchDto.price.min) {
            where.price = MoreThanOrEqual(searchDto.price.min);
        } else if (searchDto.price.max) {
            where.price = LessThanOrEqual(searchDto.price.max);
        }
    }


    const [items, total] = await this.listingRepository.findAndCount({
      where,
      order: {
        isFeatured: 'DESC',
        isUrgent: 'DESC',
        createdAt: 'DESC',
      },
      skip: (searchDto.page ?? 1 - 1) * (searchDto.limit ?? 10), //Valores por defecto.
      take: searchDto.limit ?? 10, // Valores por defecto.
      relations: ['seller', 'category'], // Corregido: la relación se llama 'seller'
    });

    return {
      items,
      total,
      page: searchDto.page ?? 1, //Valores por defecto
      limit: searchDto.limit ?? 10,//Valores por defecto
      pages: Math.ceil(total / (searchDto.limit ?? 10)), //Valores por defecto
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
              lat: listing.location.coordinates.lat, // Simplificado
              lon: listing.location.coordinates.lon, // Simplificado
            },
          }
        : undefined,
        categoryIds: listing.category ? [listing.category.id] : [], // category en singular
      sellerId: listing.seller.id, // Corregido a seller
      isActive: listing.isActive,
      isFeatured: listing.isFeatured,
      isVerified: listing.isVerified,
      isUrgent: listing.isUrgent,
      createdAt: listing.createdAt,
      publishedAt: listing.publishedAt,
      expiresAt: listing.expiresAt,
    };

     await this.elasticsearchService.index<SearchResponse<typeof document>>({ //Usa el tipo para el body
      index: this.indexName,
      id: listing.id,
      body: document, //Se infiere el tipo
    });
  }


  //No es necesario, se puede usar directamente en el controller.
  mapToResponseDto(listing: Listing): ListingResponseDto {
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