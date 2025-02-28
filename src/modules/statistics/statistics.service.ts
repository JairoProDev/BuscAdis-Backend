import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing } from '../listings/entities/listing.entity';

@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name);

  constructor(
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
  ) {}

  async getListingStats() {
    const totalListings = await this.listingRepository.count();
    const activeListings = await this.listingRepository.count({ where: { isActive: true } });
    const featuredListings = await this.listingRepository.count({ where: { isFeatured: true } });

    return {
      total: totalListings,
      active: activeListings,
      featured: featuredListings,
      inactivePercentage: ((totalListings - activeListings) / totalListings) * 100,
    };
  }
} 