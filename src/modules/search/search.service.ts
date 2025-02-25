import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { SearchDto, SearchResponseDto } from './dto/search.dto';
import { SearchResponse, SearchHit, SearchTotalHits } from '@elastic/elasticsearch/lib/api/types';
import { ListingAggregations, StatsAggregation } from './types/elasticsearch.types';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly listingsIndex = 'listings';

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async searchGeneric<T>(index: string, query: any): Promise<T[]> {
    try {
      const response = await this.elasticsearchService.search<SearchResponse<T>>({
        index,
        ...query,
      });

      return response.hits.hits.map(hit => hit._source as T);
    } catch (error) {
      this.logger.error(`Error searching in ${index}:`, (error as Error).message);
      throw error;
    }
  }

  async searchListings(searchDto: SearchDto): Promise<SearchResponseDto> {
    const {
      query,
      category,
      priceMin,
      priceMax,
      condition,
      location,
      radius,
      sort,
      page = 1,
      limit = 10,
    } = searchDto;

    const must: any[] = [{ term: { isActive: true } }];
    const filter: any[] = [];

    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['title^3', 'description^2', 'categories.name'],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    }

    if (category) {
      filter.push({
        nested: {
          path: 'categories',
          query: {
            bool: {
              should: [
                { term: { 'categories.id': category } },
                { term: { 'categories.slug': category } },
              ],
            },
          },
        },
      });
    }

    if (priceMin !== undefined || priceMax !== undefined) {
      const range: any = {};
      if (priceMin !== undefined) range.gte = priceMin;
      if (priceMax !== undefined) range.lte = priceMax;
      filter.push({ range: { price: range } });
    }

    if (condition) {
      filter.push({ term: { condition } });
    }

    if (location && radius) {
      filter.push({
        geo_distance: {
          distance: `${radius}km`,
          location: {
            lat: location.lat,
            lon: location.lon,
          },
        },
      });
    }

    const sortOptions: any[] = [];
    if (sort) {
      switch (sort) {
        case 'price_asc':
          sortOptions.push({ price: 'asc' });
          break;
        case 'price_desc':
          sortOptions.push({ price: 'desc' });
          break;
        case 'date_desc':
          sortOptions.push({ createdAt: 'desc' });
          break;
        case 'relevance':
          sortOptions.push('_score');
          break;
      }
    } else {
      sortOptions.push('_score');
    }

    const response = await this.elasticsearchService.search<SearchResponse<any, Record<string, any>>>({
      index: this.listingsIndex,
      body: {
        from: (page - 1) * limit,
        size: limit,
        query: {
          bool: {
            must,
            filter,
          },
        },
        sort: sortOptions,
        aggs: {
          price_stats: {
            stats: {
              field: 'price',
            },
          },
          conditions: {
            terms: {
              field: 'condition.keyword',
            },
          },
          categories: {
            nested: {
              path: 'categories',
            },
            aggs: {
              unique_categories: {
                terms: {
                  field: 'categories.name.keyword',
                },
              },
            },
          },
        },
      },
    });

    const hits = response.hits.hits.map((hit: SearchHit<any>) => ({
      ...hit._source,
      score: hit._score,
    }));

    const total = (response.hits.total as SearchTotalHits).value || 0;
    const aggregations = response.aggregations || {};

    const priceStats = aggregations.price_stats as StatsAggregation || {
      count: 0,
      min: 0,
      max: 0,
      avg: 0,
      sum: 0,
    };

    const conditions = (aggregations.conditions as any)?.buckets || [];
    const categories = (aggregations.categories as any)?.unique_categories?.buckets || [];

    return {
      items: hits,
      total,
      page,
      limit,
      aggregations: {
        priceStats,
        conditions,
        categories,
      },
    };
  }

  async indexListing(listing: any): Promise<void> {
    if (!listing.location?.coordinates) {
      throw new Error('Listing coordinates are required for indexing');
    }

    await this.elasticsearchService.index({
      index: this.listingsIndex,
      id: listing.id,
      body: {
        ...listing,
        location: {
          lat: listing.location.coordinates.lat,
          lon: listing.location.coordinates.lon,
        },
      },
    });
  }

  async updateListing(id: string, listing: any): Promise<void> {
    const updateBody: any = { ...listing };
    
    if (listing.location?.coordinates) {
      updateBody.location = {
        lat: listing.location.coordinates.lat,
        lon: listing.location.coordinates.lon,
      };
    }

    await this.elasticsearchService.update({
      index: this.listingsIndex,
      id,
      body: {
        doc: updateBody,
      },
    });
  }

  async removeListing(id: string): Promise<void> {
    await this.elasticsearchService.delete({
      index: this.listingsIndex,
      id,
    });
  }
} 