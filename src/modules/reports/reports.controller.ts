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
  ParseUUIDPipe, // Importa ParseUUIDPipe
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportsService } from './reports.service';
import {
  CreateReportDto,
  UpdateReportDto,
  ReportResponseDto,
} from './dto/report.dto';
import { AuthenticatedRequest } from 'src/common/types/request.type'; // Importa AuthenticatedRequest

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
    @Request() req: AuthenticatedRequest, // Usa AuthenticatedRequest
  ): Promise<ReportResponseDto> {
    const report = await this.reportsService.create(createReportDto, req.user);
    return this.reportsService['mapToResponseDto'](report);
  }

  @Get()
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get all reports' })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of reports',
    type: [ReportResponseDto],
  })
  async findAll(@Request() req: AuthenticatedRequest): Promise<ReportResponseDto[]> { // Usa AuthenticatedRequest
    const reports = await this.reportsService.findAll(
      req.user,
      req.user.roles?.includes('admin'),
    );
    return reports.map(report => this.reportsService['mapToResponseDto'](report));
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get a report by id' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the report',
    type: ReportResponseDto,
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string, // Usa ParseUUIDPipe
    @Request() req: AuthenticatedRequest, // Usa AuthenticatedRequest
  ): Promise<ReportResponseDto> {
    const report = await this.reportsService.findOne(
      id,
      req.user,
      req.user.roles?.includes('admin'),
    );
    return this.reportsService['mapToResponseDto'](report);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update a report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 200,
    description: 'The report has been successfully updated.',
    type: ReportResponseDto,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string, // Usa ParseUUIDPipe
    @Body() updateReportDto: UpdateReportDto,
    @Request() req: AuthenticatedRequest, // Usa AuthenticatedRequest
  ): Promise<ReportResponseDto> {
    const report = await this.reportsService.update(
      id,
      updateReportDto,
      req.user,
      req.user.roles?.includes('admin'),
    );
    return this.reportsService['mapToResponseDto'](report);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete a report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 200,
    description: 'The report has been successfully deleted.',
  })
  async remove(
      @Param('id', ParseUUIDPipe) id: string, // Usa ParseUUIDPipe
      @Request() req: AuthenticatedRequest, // Usa AuthenticatedRequest
    ): Promise<void>
    {
    return this.reportsService.remove(
      id,
      req.user,
      req.user.roles?.includes('admin'),
    );
  }
}