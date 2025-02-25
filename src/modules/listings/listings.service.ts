import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan, Like, FindOptionsWhere, Between, LessThanOrEqual, MoreThanOrEqual, Not } from 'typeorm';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import slugify from 'slugify';
import { Listing, ListingStatus } from './entities/listing.entity';
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import { StorageService } from '../storage/storage.service';
import {
  QuickListingDto,
  CreateListingDto,
  UpdateListingDto,
  SearchListingDto,
  ListingResponseDto, // Asegúrate de tener este DTO
} from './dto/listing.dto';
import { SearchResponse } from '@elastic/elasticsearch/lib/api/types'; // Importante para el tipado
import {ImageDto} from './dto/listing.dto';


@Injectable()
export class ListingsService {
  private readonly indexName = 'listings';
  private readonly logger = new Logger(ListingsService.name); // Logger

  constructor(
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly elasticsearchService: ElasticsearchService,
    private readonly storageService: StorageService,
  ) {
    this.createIndex(); // Llama a createIndex para asegurar que el índice exista
  }

  private async createIndex() {
        try {
            const checkIndex = await this.elasticsearchService.indices.exists({
                index: this.indexName,
            });

            if (!checkIndex.value) {
                await this.elasticsearchService.indices.create({
                    index: this.indexName,
                    body: {
                        settings: {
                            analysis: {
                                analyzer: {
                                    spanish_analyzer: {
                                        type: 'standard', // Usar 'standard', el analizador 'spanish' es predefinido
                                        stopwords: '_spanish_' // Stopwords predefinidos para español
                                    }
                                }
                            }
                        },
                        mappings: {
                          properties: {
                            id: { type: 'keyword' },
                            title: {
                              type: 'text',
                              analyzer: 'spanish_analyzer',
                              fields: {
                                keyword: {
                                  type: 'keyword',
                                  ignore_above: 256,
                                },
                              },
                            },
                            slug: { type: 'keyword' },
                            description: {
                              type: 'text',
                              analyzer: 'spanish_analyzer',
                            },
                            type: { type: 'keyword' }, // ListingType enum
                            price: { type: 'float' },
                            priceType: { type: 'keyword' }, // PriceType enum
                            status: { type: 'keyword' },  //ListingStatus
                            condition: { type: 'keyword' }, // ProductCondition enum
                            location: { type: 'geo_point' },
                            categories: { type: 'keyword' }, // Relación a Category
                            seller: { type: 'keyword' },      //Relación a User
                            isActive: { type: 'boolean' },
                            isFeatured: { type: 'boolean' },
                            isVerified: { type: 'boolean' },
                            createdAt: { type: 'date' },
                            updatedAt: { type: 'date' },
                            publishedAt: { type: 'date' },
                            expiresAt: {type: 'date'},
                          },
                        },
                    }
                });
                this.logger.log(`Created Elasticsearch index: ${this.indexName}`);
            } else {
                this.logger.log(`Elasticsearch index already exists: ${this.indexName}`);
            }
        } catch (error) {
            this.logger.error(`Error creating Elasticsearch index: ${(error as Error).message}`, (error as Error).stack);
        }
    }
  async createQuick(
    quickListingDto: QuickListingDto,
    owner: User,
  ): Promise<Listing> {
    try {
      const slug = this.generateSlug(quickListingDto.title || '');

      // Validaciones
      if (!quickListingDto.title) {
        throw new BadRequestException('El título es requerido');
      }
      if (!quickListingDto.description) {
        throw new BadRequestException('La descripción es requerida');
      }
      if (!quickListingDto.contact?.whatsapp) {
        throw new BadRequestException('El número de WhatsApp es requerido');
      }

      // Subida de imágenes
      let uploadedImages: ImageDto[] = [];
      if (quickListingDto.images?.length > 0) {
        try {
          uploadedImages = await Promise.all(
            quickListingDto.images.map(async (file, index) => {
                const url = await this.storageService.uploadFile(file);
                return{
                    url,
                    order: index,
                    alt: ''
                }
            }),
          );
        } catch (uploadError) {
          this.logger.error(
            'Error uploading images:',
            (uploadError as Error).message,
            (uploadError as Error).stack,
          );
          // Continúa sin las imágenes si falla la subida.  Podrías lanzar un error aquí si las imágenes son *obligatorias*.
        }
      }

      // Fecha de expiración
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Buscar categorías
      const categories = await this.categoryRepository.find({
        where: { id: In(quickListingDto.categoryIds || []) },
      });


      const listing = await this.listingRepository.save({
        title: quickListingDto.title,
        description: quickListingDto.description,
        slug,
        seller: owner, //  'seller'
        type: quickListingDto.type,
        categories: categories, // Asigna las categorías
        contact: quickListingDto.contact,
        location: quickListingDto.location,
        price: quickListingDto.price,
        images: uploadedImages,
        status: ListingStatus.ACTIVE,
        publishedAt: new Date(),
        expiresAt,
        isActive: true,
        isVerified: false,
        isFeatured: false,
        isUrgent: false,
      });

      // Indexar en Elasticsearch
      try {
        await this.indexListing(listing);
      } catch (indexError) {
        this.logger.error(
          'Error indexing listing:',
          (indexError as Error).message,
          (indexError as Error).stack,
        );
        // Continúa aunque falle la indexación.
      }

      return listing;
    } catch (error) {
      this.logger.error('Error in createQuick:', (error as Error).message, (error as Error).stack);

      if (error instanceof BadRequestException) {
        throw error; // Re-lanza BadRequestException
      }

      throw new BadRequestException(
        (error as Error).message ||
        'Error al crear el anuncio. Por favor, intenta de nuevo.',
      );
    }
  }

  private generateSlug(title: string): string {
    const baseSlug = slugify(title, { lower: true, strict: true });
    const timestamp = Date.now();
    return `<span class="math-inline">\{baseSlug\}\-</span>{timestamp}`;
  }


  async create(createListingDto: CreateListingDto, seller: User): Promise<Listing> {

      try{
        const slug = this.generateSlug(createListingDto.title);
        const categories = await this.categoryRepository.findByIds(createListingDto.categoryIds);

        const listing = this.listingRepository.create({
            ...createListingDto,
            slug,
            seller,
            categories, //Asegurate de que en el DTO pones categories, y en la entidad categories tambien.
            status: createListingDto.status || ListingStatus.ACTIVE, //Por defecto activo
            publishedAt: new Date(),
          });

          const savedListing = await this.listingRepository.save(listing);
          await this.indexListing(savedListing);
          return savedListing;

      } catch(error){
        this.logger.error(`Error creating listing: ${(error as Error).message}`, (error as Error).stack);
        throw new BadRequestException((error as Error).message || 'Error al crear el anuncio'); // Mejorar mensajes de error

      }
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
      relations: ['seller', 'categories'], // Carga las relaciones
    });
  }

  async findOne(id: string): Promise<Listing> {
    const listing = await this.listingRepository.findOne({
      where: { id },
      relations: ['seller', 'categories'], // Carga las relaciones
    });

    if (!listing) {
      throw new NotFoundException('Anuncio no encontrado');
    }

    if (
      !listing.isActive ||
      listing.status !== ListingStatus.ACTIVE ||
      listing.expiresAt < new Date()
    ) {
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
      throw new ForbiddenException(
        'Solo puedes actualizar tus propios anuncios',
      );
    }

    if (updateListingDto.title) {
       const newSlug = this.generateSlug(updateListingDto.title);
        // Comprueba si el nuevo slug ya existe (y no pertenece al mismo anuncio)
        const existingListing = await this.listingRepository.findOne({
            where: { slug: newSlug, id: Not(id) }, // Excluye el anuncio actual
        });

        if (existingListing) {
            updateListingDto.slug = `<span class="math-inline">\{newSlug\}\-</span>{Date.now()}`; // Añade un timestamp para hacerlo único
        } else {
            updateListingDto.slug = newSlug; // Usa el nuevo slug
        }
    }

    //Si la categoría viene en el DTO, actualiza las categorías
    if(updateListingDto.categoryIds){
        const categories = await this.categoryRepository.findByIds(updateListingDto.categoryIds);
        listing.categories = categories;
    }

     // Asegura que publishedAt se establezca solo una vez.
     if (updateListingDto.status === ListingStatus.PUBLISHED && !listing.publishedAt) {
        listing.publishedAt = new Date();
    }


    Object.assign(listing, updateListingDto);
    const updatedListing = await this.listingRepository.save(listing);
    await this.indexListing(updatedListing); // Actualiza el índice de Elasticsearch

    return updatedListing;
  }

  async remove(id: string, user: User): Promise<void> {
    const listing = await this.findOne(id);

    if (listing.seller.id !== user.id) {
      throw new ForbiddenException('Solo puedes eliminar tus propios anuncios');
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

        // Búsqueda por texto (usando Elasticsearch)
        if (searchDto.query) {
           try{
                const { body } = await this.elasticsearchService.search<SearchResponse<Listing>>({ //Usa el SearchResponse.
                    index: this.indexName,
                    body: {
                        query: {
                            multi_match: {
                                query: searchDto.query,
                                fields: ['title', 'description'],
                                fuzziness: 'AUTO'
                            }
                        }
                    }
                });
                const hits = body.hits.hits;
                const listingIds = hits.map((hit: any) => hit._source.id);

                // Si no hay resultados, retornar un array vacío en lugar de hacer otra consulta.
                if(listingIds.length === 0) {
                    return {
                        items: [],
                        total: 0,
                        page: searchDto.page ?? 1,
                        limit: searchDto.limit ?? 10,
                        pages: 0,
                      };
                }


                where.id = In(listingIds); // Usa los IDs de Elasticsearch

           } catch(error){
                this.logger.error(`Error searching in Elasticsearch: ${(error as Error).message}`, (error as Error).stack);
                // Opcional: podrías decidir no usar Elasticsearch si falla, y hacer una búsqueda por base de datos
           }
        }

      //Filtro por categoría
      if (searchDto.categoryId) {
        where.category = { id: searchDto.categoryId } as any;
      }


        // Filtro por ubicación (búsqueda simple por rango)
       if (searchDto.location?.latitude && searchDto.location?.longitude) {
            const lat = searchDto.location.latitude;
            const lon = searchDto.location.longitude;
            const range = 0.1; // Ajusta este valor según sea necesario

            where.location = {
                coordinates: {
                    lat: Between(lat - range, lat + range),
                    lon: Between(lon - range, lon + range)
                }
            } as Partial<FindOptionsWhere<Listing>>; //Usar Partial.
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
            skip: (searchDto.page ?? 1 - 1) * (searchDto.limit ?? 10),
            take: searchDto.limit ?? 10,
            relations: ['seller', 'categories'], // Carga las relaciones
        });

        return {
            items,
            total,
            page: searchDto.page ?? 1,
            limit: searchDto.limit ?? 10,
            pages: Math.ceil(total / (searchDto.limit ?? 10)),
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
      priceType: listing.priceType, // Asegúrate de que priceType exista en tu entidad y DTOs
      status: listing.status,
      location: listing.location
        ? {
            lat: listing.location.coordinates.lat,
            lon: listing.location.coordinates.lon,
          }
        : undefined, // Maneja el caso en que location pueda ser null
      categoryIds: listing.categories?.map((cat:any) => cat.id) || [],  // Extrae los IDs de las categorías, any temporal
      sellerId: listing.seller.id,
      isActive: listing.isActive,
      isFeatured: listing.isFeatured,
      isVerified: listing.isVerified,
      isUrgent: listing.isUrgent,
      createdAt: listing.createdAt,
      publishedAt: listing.publishedAt,
      expiresAt: listing.expiresAt,
    };

    // Sin tipado genérico.  El tipo se infiere de `document`.
    await this.elasticsearchService.index({
      index: this.indexName,
      id: listing.id,
      body: document,
    });
  }



  mapToResponseDto(listing: Listing): ListingResponseDto {
    const { seller, categories, ...listingData } = listing;

    // Mapear las categorías a un formato más simple (si es necesario)
    const mappedCategories = categories.map((category: any) => ({
      id: category.id,
      name: category.name,
      // ... otras propiedades de la categoría que quieras incluir
    }));

    return {
      ...listingData,
      seller: {
        id: seller.id,
        firstName: seller.firstName,
        lastName: seller.lastName,
        email: seller.email,
        // ... otras propiedades del vendedor que quieras incluir en la respuesta
      },
      categories: mappedCategories,
    };
  }
}