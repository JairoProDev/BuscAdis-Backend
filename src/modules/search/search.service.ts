import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing } from '../listings/entities/listing.entity';
import { SearchDto, SearchResponseDto, PriceStatsDto, ConditionBucketDto, CategoryBucketDto } from './dto/search.dto';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
  ) {}

  async searchListings(searchDto: SearchDto): Promise<SearchResponseDto> {
    const [items, total] = await this.listingRepository.findAndCount({
      where: this.buildSearchQuery(searchDto),
      take: searchDto.limit || 10,
      skip: ((searchDto.page || 1) - 1) * (searchDto.limit || 10),
      relations: ['categories', 'seller'],
    });

    return {
      items,
      total,
      page: searchDto.page || 1,
      limit: searchDto.limit || 10,
      pages: Math.ceil(total / (searchDto.limit || 10)),
      aggregations: {
        priceStats: this.calculatePriceStats(items),
        conditions: this.calculateConditions(items),
        categories: this.calculateCategories(items),
      },
    };
  }

  private buildSearchQuery(searchDto: SearchDto) {
    const query: any = {};
    if (searchDto.query) {
      query.title = { $regex: searchDto.query, $options: 'i' };
    }
    return query;
  }

  private calculatePriceStats(items: Listing[]): PriceStatsDto {
    if (!items.length) {
      return {
        min: 0,
        max: 0,
        avg: 0,
        sum: 0,
        count: 0,
      };
    }
    const prices = items.map(item => item.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((a, b) => a + b, 0) / prices.length,
      sum: prices.reduce((a, b) => a + b, 0),
      count: prices.length,
    };
  }

  private calculateConditions(items: Listing[]): ConditionBucketDto[] {
    const conditionsMap = items.reduce((acc, item) => {
      acc[item.condition] = (acc[item.condition] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(conditionsMap).map(([condition, count]) => ({
      condition,
      count,
    }));
  }

  private calculateCategories(items: Listing[]): CategoryBucketDto[] {
    const categoriesMap = items.reduce((acc, item) => {
      item.categories.forEach(category => {
        acc[category.name] = (acc[category.name] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoriesMap).map(([name, count]) => ({
      name,
      count,
    }));
  }

  async createIndex(): Promise<void> {
    // Implementar si es necesario
  }

  async deleteIndex(): Promise<void> {
    // Implementar si es necesario
  }
} 