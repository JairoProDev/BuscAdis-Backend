import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
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
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
  ) {}

  async create(createReportDto: CreateReportDto, user: User): Promise<ReportResponseDto> {
    const report = this.reportRepository.create({
      ...createReportDto,
      reporter: user,
    });

    const savedReport = await this.reportRepository.save(report);
    return this.mapToResponseDto(savedReport);
  }

  async findAll(): Promise<ReportResponseDto[]> {
    const reports = await this.reportRepository.find({
      relations: ['reporter', 'reportedUser', 'listing'],
    });
    return reports.map(report => this.mapToResponseDto(report));
  }

  async findOne(id: string): Promise<ReportResponseDto> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['reporter', 'reportedUser', 'listing'],
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return this.mapToResponseDto(report);
  }

  async update(id: string, updateReportDto: UpdateReportDto): Promise<ReportResponseDto> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['reporter', 'reportedUser', 'listing'],
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    Object.assign(report, updateReportDto);
    const updatedReport = await this.reportRepository.save(report);
    return this.mapToResponseDto(updatedReport);
  }

  async remove(id: string): Promise<void> {
    const report = await this.reportRepository.findOne({ where: { id } });
    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    await this.reportRepository.remove(report);
  }

  private mapToResponseDto(report: Report): ReportResponseDto {
    return {
      id: report.id,
      type: report.type,
      reason: report.reason,
      description: report.description,
      status: report.status,
      reporter: {
        id: report.reporter.id,
        firstName: report.reporter.firstName,
        lastName: report.reporter.lastName,
        email: report.reporter.email,
      },
      reportedUser: report.reportedUser ? {
        id: report.reportedUser.id,
        firstName: report.reportedUser.firstName,
        lastName: report.reportedUser.lastName,
        email: report.reportedUser.email,
      } : undefined,
      listing: report.listing ? {
        id: report.listing.id,
        title: report.listing.title,
        slug: report.listing.slug,
        type: report.listing.type
      } : undefined,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      resolvedAt: report.resolvedAt,
    };
  }
} 