import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';
import {
  CreateReportDto,
  UpdateReportDto,
  ReportResponseDto,
} from './dto/report.dto';
import { AuthenticatedRequest } from '../../common/types/request.type';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new report' })
  @ApiResponse({
    status: 201,
    description: 'The report has been successfully created.',
    type: ReportResponseDto,
  })
  async create(
    @Body() createReportDto: CreateReportDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ReportResponseDto> {
    return this.reportsService.create(createReportDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reports' })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of reports',
    type: [ReportResponseDto],
  })
  async findAll(@Request() req: AuthenticatedRequest): Promise<ReportResponseDto[]> {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can view all reports');
    }
    return this.reportsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a report by id' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the report',
    type: ReportResponseDto,
  })
  async findOne(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<ReportResponseDto> {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can view reports');
    }
    return this.reportsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 200,
    description: 'The report has been successfully updated.',
    type: ReportResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateReportDto: UpdateReportDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ReportResponseDto> {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can update reports');
    }
    return this.reportsService.update(id, updateReportDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 200,
    description: 'The report has been successfully deleted.',
  })
  async remove(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can delete reports');
    }
    await this.reportsService.remove(id);
  }
}