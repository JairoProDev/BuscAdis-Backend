import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportStatus } from './entities/report.entity';
import { Listing } from '../listings/entities/listing.entity';
import { User } from '../users/entities/user.entity';
import {
  CreateReportDto,
  UpdateReportDto,
  ReportResponseDto,
} from './dto/report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
  ) {}

  async create(createReportDto: CreateReportDto, reporter: User): Promise<Report> {
    const listing = await this.listingRepository.findOne({
      where: { id: createReportDto.listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const report = this.reportRepository.create({
      ...createReportDto,
      reporter,
      listing,
    });

    return this.reportRepository.save(report);
  }

  async findAll(user: User, isAdmin: boolean): Promise<Report[]> {
    if (isAdmin) {
      return this.reportRepository.find({
        relations: ['reporter', 'listing', 'reviewedBy'],
        order: { createdAt: 'DESC' },
      });
    }

    return this.reportRepository.find({
      where: { reporter: { id: user.id } },
      relations: ['reporter', 'listing', 'reviewedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user: User, isAdmin: boolean): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['reporter', 'listing', 'reviewedBy'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (!isAdmin && report.reporter.id !== user.id) {
      throw new ForbiddenException('You can only access your own reports');
    }

    return report;
  }

  async update(
    id: string,
    updateReportDto: UpdateReportDto,
    user: User,
    isAdmin: boolean,
  ): Promise<Report> {
    const report = await this.findOne(id, user, isAdmin);

    if (!isAdmin) {
      throw new ForbiddenException('Only admins can update reports');
    }

    Object.assign(report, updateReportDto);

    if (updateReportDto.status === ReportStatus.RESOLVED && !report.resolvedAt) {
      report.resolvedAt = new Date();
      report.reviewedBy = user;
    }

    return this.reportRepository.save(report);
  }

  async remove(id: string, user: User, isAdmin: boolean): Promise<void> {
    const report = await this.findOne(id, user, isAdmin);

    if (!isAdmin && report.reporter.id !== user.id) {
      throw new ForbiddenException('You can only delete your own reports');
    }

    await this.reportRepository.remove(report);
  }

  private mapToResponseDto(report: Report): ReportResponseDto {
    return {
      id: report.id,
      reporter: {
        id: report.reporter.id,
        firstName: report.reporter.firstName,
        lastName: report.reporter.lastName,
        email: report.reporter.email,
      },
      listing: {
        id: report.listing.id,
        title: report.listing.title,
        slug: report.listing.slug,
        type: report.listing.type,
      },
      reason: report.reason,
      description: report.description,
      status: report.status,
      adminNotes: report.adminNotes,
      evidence: report.evidence,
      reviewedBy: report.reviewedBy
        ? {
            id: report.reviewedBy.id,
            firstName: report.reviewedBy.firstName,
            lastName: report.reviewedBy.lastName,
            email: report.reviewedBy.email,
          }
        : undefined,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      resolvedAt: report.resolvedAt,
    };
  }
} 