import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { SearchDto, SearchResponseDto } from './dto/search.dto';

@Injectable()
export class SearchService {
  private readonly listingsIndex = 'listings';

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async search(searchDto: SearchDto): Promise<SearchResponseDto> {
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

    // Full text search
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

    // Category filter
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

    // Price range filter
    if (priceMin !== undefined || priceMax !== undefined) {
      const range: any = {};
      if (priceMin !== undefined) range.gte = priceMin;
      if (priceMax !== undefined) range.lte = priceMax;
      filter.push({ range: { price: range } });
    }

    // Condition filter
    if (condition) {
      filter.push({ term: { condition } });
    }

    // Location filter
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

    // Build sort options
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

    // Execute search
    const { body } = await this.elasticsearchService.search({
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

    const hits = body.hits.hits.map((hit: any) => ({
      ...hit._source,
      score: hit._score,
    }));

    return {
      items: hits,
      total: body.hits.total.value,
      page,
      limit,
      aggregations: {
        priceStats: body.aggregations.price_stats,
        conditions: body.aggregations.conditions.buckets,
        categories: body.aggregations.categories.unique_categories.buckets,
      },
    };
  }

  async indexListing(listing: any): Promise<void> {
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
    await this.elasticsearchService.update({
      index: this.listingsIndex,
      id,
      body: {
        doc: {
          ...listing,
          location: listing.location
            ? {
                lat: listing.location.coordinates.lat,
                lon: listing.location.coordinates.lon,
              }
            : undefined,
        },
      },
    });
  }

  async removeListing(id: string): Promise<void> {
    await this.elasticsearchService.delete({
      index: this.listingsIndex,
      id,
    });
  }

  async createIndex(): Promise<void> {
    const indexExists = await this.elasticsearchService.indices.exists({
      index: this.listingsIndex,
    });

    if (!indexExists.body) {
      await this.elasticsearchService.indices.create({
        index: this.listingsIndex,
        body: {
          mappings: {
            properties: {
              title: { type: 'text', analyzer: 'standard' },
              description: { type: 'text', analyzer: 'standard' },
              price: { type: 'float' },
              condition: { type: 'keyword' },
              location: { type: 'geo_point' },
              categories: {
                type: 'nested',
                properties: {
                  id: { type: 'keyword' },
                  name: { type: 'text', fields: { keyword: { type: 'keyword' } } },
                  slug: { type: 'keyword' },
                },
              },
              seller: {
                properties: {
                  id: { type: 'keyword' },
                  firstName: { type: 'text' },
                  lastName: { type: 'text' },
                  rating: { type: 'float' },
                },
              },
              isActive: { type: 'boolean' },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' },
            },
          },
          settings: {
            analysis: {
              analyzer: {
                standard: {
                  type: 'standard',
                  stopwords: '_english_',
                },
              },
            },
          },
        },
      });
    }
  }
} 