import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Publication } from '../publications/entities/publication.entity';

@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name);

  constructor(
    @InjectRepository(Publication)
    private readonly publicationRepository: Repository<Publication>,
  ) {}

  async getPublicationStats() {
    const totalPublications = await this.publicationRepository.count();
    const activePublications = await this.publicationRepository.count({ where: { isActive: true } });
    const featuredPublications = await this.publicationRepository.count({ where: { isFeatured: true } });

    return {
      total: totalPublications,
      active: activePublications,
      featured: featuredPublications,
      inactivePercentage: ((totalPublications - activePublications) / totalPublications) * 100,
    };
  }
} 