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
  ListingResponseDto,
} from './dto/listing.dto';
import { SearchResponse, SearchHit } from '@elastic/elasticsearch/lib/api/types';
import { ImageDto } from './dto/listing.dto';

@Injectable()
export class ListingsService {
  private readonly indexName = 'listings';
  private readonly logger = new Logger(ListingsService.name);

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
    try {
      const checkIndex = await this.elasticsearchService.indices.exists({
        index: this.indexName,
      });

        if (!checkIndex) { // Removed .value
        await this.elasticsearchService.indices.create({
          index: this.indexName,
          body: {
            settings: {
              analysis: {
                analyzer: {
                  spanish_analyzer: {
                    type: 'standard',
                    stopwords: '_spanish_'
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
                    keyword: { type: 'keyword' }
                  }
                },
                slug: { type: 'keyword' },
                description: {
                  type: 'text',
                  analyzer: 'spanish_analyzer'
                },
                type: { type: 'keyword' },
                price: { type: 'float' },
                priceType: { type: 'keyword' },
                status: { type: 'keyword' },
                condition: { type: 'keyword' }, // Make sure this exists in your entity
                location: { type: 'geo_point' },
                categories: { type: 'keyword' }, // Corrected relationship
                seller: { type: 'keyword' },      // Corrected relationship
                isActive: { type: 'boolean' },
                isFeatured: { type: 'boolean' },
                isVerified: { type: 'boolean' },
                isUrgent: { type: 'boolean' },
                createdAt: { type: 'date' },
                updatedAt: { type: 'date' },
                publishedAt: { type: 'date' },
                expiresAt: { type: 'date' },
              },
            },
          },
        });
        this.logger.log(`Created Elasticsearch index: ${this.indexName}`);
      } else {
        this.logger.log(`Elasticsearch index already exists: ${this.indexName}`);
      }
    } catch (error) {
      this.logger.error(`Error creating Elasticsearch index: ${ (error as Error).message}`, (error as Error).stack);
    }
  }

    async createQuick( quickListingDto: QuickListingDto, owner: User,): Promise<Listing> {
        try {
            const slug = this.generateSlug(quickListingDto.title || '');

            if (!quickListingDto.title) {
                throw new BadRequestException('El título es requerido');
            }
            if (!quickListingDto.description) {
                throw new BadRequestException('La descripción es requerida');
            }
            if (!quickListingDto.contact?.whatsapp) {
                throw new BadRequestException('El número de WhatsApp es requerido');
            }

            //Verifica que price exista.
            if (quickListingDto.price === undefined || quickListingDto.price === null) {
                throw new BadRequestException('El precio es requerido');
            }

            let uploadedImages: ImageDto[] = [];
            //Verifica que la propiedad images exista.
            if (quickListingDto.images && quickListingDto.images.length > 0) {
                try {
                    uploadedImages = await Promise.all(
                      //Tipado correcto.
                        quickListingDto.images.map(async (file: Express.Multer.File, index: number) => {
                            const url = await this.storageService.uploadFile(file);
                            return {
                                url,
                                order: index,
                                alt: '',
                            };
                        }),
                    );
                } catch (uploadError) {
                    this.logger.error(
                      'Error uploading images:',
                      (uploadError as Error).message,
                      (uploadError as Error).stack,
                    );
                }
            }

            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30);

            //Verifica que la propiedad categoryIds exista
            const categories = await this.categoryRepository.find({
                where: { id: In(quickListingDto.categoryIds || []) },
            });


            const listing = await this.listingRepository.save({
                title: quickListingDto.title,
                description: quickListingDto.description,
                slug,
                seller: owner, //  relación correcta con User
                type: quickListingDto.type,
                categories: categories, //  usa categories, la relación en la entidad.
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
                this.logger.error('Error indexing listing:', (indexError as Error).message, (indexError as Error).stack);
            }
            return listing;

        } catch (error) {
            this.logger.error('Error in createQuick:', (error as Error).message, (error as Error).stack);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException((error as Error).message || 'Error al crear el anuncio.  Por favor intenta de nuevo.');
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
                status: createListingDto.status || ListingStatus.ACTIVE, //  status, con valor por defecto
                publishedAt: new Date(),
            });

            const savedListing = await this.listingRepository.save(listing);
            await this.indexListing(savedListing); //  indexación
            return savedListing; // Devuelve la entidad

        } catch (error) {
            this.logger.error(`Error creating listing: ${(error as Error).message}`, (error as Error).stack);
            throw new BadRequestException((error as Error).message || 'Error al crear el anuncio');
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
      relations: ['seller', 'categories'], // Carga las relaciones.  'categories' en plural
    });
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
      listing.status !== ListingStatus.ACTIVE ||
      listing.expiresAt < new Date()
    ) {
      throw new NotFoundException('Este anuncio ya no está disponible');
    }

    return listing;
  }

    async update(id: string, updateListingDto: UpdateListingDto, user: User,): Promise<Listing> {

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
                updateListingDto.slug = newSlug; // Usa el nuevo slug
            }
        }


        if(updateListingDto.categoryIds){
            const categories = await this.categoryRepository.findByIds(updateListingDto.categoryIds);
            listing.categories = categories;
        }

        if (updateListingDto.status === ListingStatus.PUBLISHED && !listing.publishedAt) {
            listing.publishedAt = new Date();
        }


        Object.assign(listing, updateListingDto);
        const updatedListing = await this.listingRepository.save(listing);
        await this.indexListing(updatedListing);

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

        if (searchDto.query) {
            try{
                const { hits } = await this.elasticsearchService.search<SearchResponse<Listing>>({ // TIPADO CORRECTO
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
            const listingIds = hits.hits.map((hit: SearchHit<Listing>) => hit._source!.id); //  SearchHit<Listing>

            if(listingIds.length === 0) {
                return {
                    items: [],
                    total: 0,
                    page: searchDto.page ?? 1,
                    limit: searchDto.limit ?? 10,
                    pages: 0,
                };
            }
                where.id = In(listingIds);

            } catch (error) {
                this.logger.error(`Error searching in Elasticsearch: ${(error as Error).message}`, (error as Error).stack);
            }
        }

        // category en singular.
        if (searchDto.categoryId) {
          where.category = { id: searchDto.categoryId } as any;
        }

        // location
       if (searchDto.location?.latitude && searchDto.location?.longitude)
       {
           const lat = searchDto.location.latitude;
           const lon = searchDto.location.longitude;
           const range = 0.1; //

           where.location = {
               coordinates: {
                  lat: Between(lat - range, lat + range),
                  lon: Between(lon - range, lon + range)
                }

           } as Partial<FindOptionsWhere<Listing>>; //Usar Partial
       }


        if (searchDto.priceRange?.min || searchDto.priceRange?.max) {
            if (searchDto.priceRange.min && searchDto.priceRange.max) {
                where.price = Between(searchDto.priceRange.min, searchDto.priceRange.max);
            } else if (searchDto.priceRange.min) {
                where.price = MoreThanOrEqual(searchDto.priceRange.min);
            } else if (searchDto.priceRange.max) {
                where.price = LessThanOrEqual(searchDto.priceRange.max);
            }
        }

        const [items, total] = await this.listingRepository.findAndCount({
            where,
            order: {
                isFeatured: 'DESC',
                isUrgent: 'DESC',
                createdAt: 'DESC',
            },
            skip: (searchDto.page ?? 1 - 1) * (searchDto.limit ?? 10), // Valores por defecto
            take: searchDto.limit ?? 10, // Valor por defecto
            relations: ['seller', 'categories'], // Carga las relaciones
        });

        return {
            items: items.map(listing => this.mapToResponseDto(listing)), //  mapToResponseDto
            total,
            page: searchDto.page ?? 1,
            limit: searchDto.limit ?? 10,
            pages: Math.ceil(total / (searchDto.limit ?? 10)),
        };
    }

  private async indexListing(listing: Listing) {
    //  undefined si no hay coordenadas
    const coordinates = listing.location?.coordinates
      ? {
          lat: listing.location.coordinates.lat,
          lon: listing.location.coordinates.lon,
        }
      : undefined;

    const document = {
      id: listing.id,
      title: listing.title,
      slug: listing.slug,
      description: listing.description,
      type: listing.type,
      price: listing.price,
      priceType: listing.priceType,
      status: listing.status,
      condition: listing.condition, //  condition
      location: listing.location ? { coordinates } : undefined, //  coordinates
      categoryIds: listing.categories?.map((cat:Category) => cat.id) || [], //  categoryIds
      sellerId: listing.seller.id,
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
      id: listing.id,  // Use the listing ID
      body: document,
    });
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
                alt: image.alt,
                order: image.order,
            })) : [],
            favorites: listing.favorites?.length || 0,
        };
    }
}