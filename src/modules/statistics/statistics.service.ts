import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Classifiedad } from '../classifiedads/entities/classifiedad.entity';

@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name);

  constructor(
    @InjectRepository(Classifiedad)
    private readonly classifiedadRepository: Repository<Classifiedad>,
  ) {}

  async getClassifiedadStats() {
    const totalClassifiedads = await this.classifiedadRepository.count();
    const activeClassifiedads = await this.classifiedadRepository.count({ where: { isActive: true } });
    const featuredClassifiedads = await this.classifiedadRepository.count({ where: { isFeatured: true } });

    return {
      total: totalClassifiedads,
      active: activeClassifiedads,
      featured: featuredClassifiedads,
      inactivePercentage: ((totalClassifiedads - activeClassifiedads) / totalClassifiedads) * 100,
    };
  }
} 