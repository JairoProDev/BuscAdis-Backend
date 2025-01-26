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
import { Product, ProductStatus } from './entities/product.entity';
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import {
  CreateProductDto,
  UpdateProductDto,
  SearchProductsDto,
  ProductResponseDto,
} from './dto/product.dto';

@Injectable()
export class ProductsService {
  private readonly indexName = 'products';

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
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
              price: { type: 'float' },
              priceType: { type: 'keyword' },
              status: { type: 'keyword' },
              condition: { type: 'keyword' },
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
              sellerId: { type: 'keyword' },
              isActive: { type: 'boolean' },
              isFeatured: { type: 'boolean' },
              isVerified: { type: 'boolean' },
              createdAt: { type: 'date' },
              publishedAt: { type: 'date' },
            },
          },
        },
      });
    }
  }

  async create(createProductDto: CreateProductDto, seller: User): Promise<Product> {
    const slug = createProductDto.slug ||
      slugify(createProductDto.title, { lower: true, strict: true });

    const existingProduct = await this.productRepository.findOne({
      where: { slug },
    });

    if (existingProduct) {
      throw new ConflictException('Product with this slug already exists');
    }

    const categories = await this.categoryRepository.findBy({
      id: In(createProductDto.categoryIds),
    });

    if (categories.length !== createProductDto.categoryIds.length) {
      throw new NotFoundException('Some categories not found');
    }

    const product = this.productRepository.create({
      ...createProductDto,
      slug,
      seller,
      categories,
    });

    const savedProduct = await this.productRepository.save(product);
    await this.indexProduct(savedProduct);

    return savedProduct;
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find({
      where: { isActive: true, status: ProductStatus.PUBLISHED },
      relations: ['seller', 'categories'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['seller', 'categories'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    user: User,
  ): Promise<Product> {
    const product = await this.findOne(id);

    if (product.seller.id !== user.id) {
      throw new ForbiddenException('You can only update your own products');
    }

    if (updateProductDto.categoryIds) {
      const categories = await this.categoryRepository.findBy({
        id: In(updateProductDto.categoryIds),
      });

      if (categories.length !== updateProductDto.categoryIds.length) {
        throw new NotFoundException('Some categories not found');
      }

      product.categories = categories;
    }

    if (updateProductDto.title && !updateProductDto.slug) {
      updateProductDto.slug = slugify(updateProductDto.title, {
        lower: true,
        strict: true,
      });
    }

    if (updateProductDto.slug && updateProductDto.slug !== product.slug) {
      const existingProduct = await this.productRepository.findOne({
        where: { slug: updateProductDto.slug },
      });

      if (existingProduct && existingProduct.id !== id) {
        throw new ConflictException('Product with this slug already exists');
      }
    }

    Object.assign(product, updateProductDto);

    if (updateProductDto.status === ProductStatus.PUBLISHED) {
      product.publishedAt = new Date();
    }

    const updatedProduct = await this.productRepository.save(product);
    await this.indexProduct(updatedProduct);

    return updatedProduct;
  }

  async remove(id: string, user: User): Promise<void> {
    const product = await this.findOne(id);

    if (product.seller.id !== user.id) {
      throw new ForbiddenException('You can only delete your own products');
    }

    await this.productRepository.remove(product);
    await this.elasticsearchService.delete({
      index: this.indexName,
      id,
    });
  }

  async search(searchDto: SearchProductsDto) {
    const {
      query,
      status,
      condition,
      categoryId,
      sellerId,
      minPrice,
      maxPrice,
      location,
      isFeatured,
      isVerified,
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

    if (status) {
      filter.push({ term: { status } });
    }

    if (condition) {
      filter.push({ term: { condition } });
    }

    if (categoryId) {
      filter.push({ term: { categoryIds: categoryId } });
    }

    if (sellerId) {
      filter.push({ term: { sellerId } });
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const range: any = {};
      if (minPrice !== undefined) range.gte = minPrice;
      if (maxPrice !== undefined) range.lte = maxPrice;
      filter.push({ range: { price: range } });
    }

    if (isFeatured !== undefined) {
      filter.push({ term: { isFeatured } });
    }

    if (isVerified !== undefined) {
      filter.push({ term: { isVerified } });
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
        const product = await this.findOne(hit._source.id);
        return {
          ...this.mapToResponseDto(product),
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

  private async indexProduct(product: Product) {
    const document = {
      id: product.id,
      title: product.title,
      slug: product.slug,
      description: product.description,
      price: product.price,
      priceType: product.priceType,
      status: product.status,
      condition: product.condition,
      location: {
        ...product.location,
        coordinates: {
          lat: product.location.coordinates.latitude,
          lon: product.location.coordinates.longitude,
        },
      },
      categoryIds: product.categories.map(c => c.id),
      sellerId: product.seller.id,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      isVerified: product.isVerified,
      createdAt: product.createdAt,
      publishedAt: product.publishedAt,
    };

    await this.elasticsearchService.index({
      index: this.indexName,
      id: product.id,
      body: document,
    });
  }

  private mapToResponseDto(product: Product): ProductResponseDto {
    return {
      id: product.id,
      title: product.title,
      slug: product.slug,
      description: product.description,
      price: product.price,
      priceType: product.priceType,
      status: product.status,
      condition: product.condition,
      images: product.images,
      location: product.location,
      views: product.views,
      likes: product.likes,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      isVerified: product.isVerified,
      seller: {
        id: product.seller.id,
        firstName: product.seller.firstName,
        lastName: product.seller.lastName,
        email: product.seller.email,
      },
      categories: product.categories.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      publishedAt: product.publishedAt,
      soldAt: product.soldAt,
    };
  }
} 