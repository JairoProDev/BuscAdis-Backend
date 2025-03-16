import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClassifiedadsService } from './classifiedads.service';
import {
  QuickClassifiedadDto,
  CreateClassifiedadDto,
  UpdateClassifiedadDto,
  SearchClassifiedadDto,
  ClassifiedadResponseDto,
} from './dto/classifiedad.dto';
import { AuthenticatedRequest } from 'src/common/types/request.type';

@ApiTags('classifiedads')
@Controller('classifiedads')
export class ClassifiedadsController {
  constructor(private readonly classifiedadsService: ClassifiedadsService) {}

  @Post('quick')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new classifiedad quickly with minimal information' })
  @ApiResponse({
    status: 201,
    description: 'The classifiedad has been successfully created.',
    type: ClassifiedadResponseDto,
  })
  async createQuick(
    @Body() quickClassifiedadDto: QuickClassifiedadDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ClassifiedadResponseDto> {
    const classifiedad = await this.classifiedadsService.createQuick(quickClassifiedadDto, req.user);
    return this.classifiedadsService.mapToResponseDto(classifiedad);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new classifiedad' })
  @ApiResponse({ status: 201, description: 'The classifiedad has been created', type: ClassifiedadResponseDto })
  async create(
    @Body() createClassifiedadDto: CreateClassifiedadDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ClassifiedadResponseDto> {
    const classifiedad = await this.classifiedadsService.create(createClassifiedadDto, req.user);
    return this.classifiedadsService.mapToResponseDto(classifiedad);
  }

  @Get()
  @ApiOperation({ summary: 'Get all published classifiedads' })
  @ApiResponse({ status: 200, description: 'Return all published classifiedads', type: [ClassifiedadResponseDto] })
  async findAll(): Promise<ClassifiedadResponseDto[]> {
    const classifiedads = await this.classifiedadsService.findAll();
    return Promise.all(classifiedads.map(classifiedad => this.classifiedadsService.mapToResponseDto(classifiedad)));
  }

  @Get('search')
  @ApiOperation({ summary: 'Search classifiedads with filters' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated search results',
  })
  async search(@Query() searchDto: SearchClassifiedadDto) {
    return this.classifiedadsService.search(searchDto);
  }

  @Get('my-classifiedads')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user classifiedads' })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of user classifiedads',
    type: [ClassifiedadResponseDto],
  })
  async getMyClassifiedads(@Request() req: AuthenticatedRequest): Promise<ClassifiedadResponseDto[]> {
    const searchDto: SearchClassifiedadDto = {
      limit: 100,
    };
    
    const classifiedads = await this.classifiedadsService.search(searchDto);
    
    // Return only the items array
    return classifiedads.items; // Ensure this returns the correct array
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a classifiedad by id' })
  @ApiParam({ name: 'id', description: 'Classifiedad ID' })
  @ApiResponse({ status: 200, description: 'Return the classifiedad', type: ClassifiedadResponseDto })
  @ApiResponse({ status: 404, description: 'Classifiedad not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ClassifiedadResponseDto> {
    const classifiedad = await this.classifiedadsService.findOne(id);
    return this.classifiedadsService.mapToResponseDto(classifiedad);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a classifiedad' })
  @ApiParam({ name: 'id', description: 'Classifiedad ID' })
  @ApiResponse({ status: 200, description: 'The classifiedad has been updated', type: ClassifiedadResponseDto })
  @ApiResponse({ status: 404, description: 'Classifiedad not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClassifiedadDto: UpdateClassifiedadDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ClassifiedadResponseDto> {
    const classifiedad = await this.classifiedadsService.update(id, updateClassifiedadDto, req.user);
    return this.classifiedadsService.mapToResponseDto(classifiedad);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a classifiedad' })
  @ApiParam({ name: 'id', description: 'Classifiedad ID' })
  @ApiResponse({ status: 200, description: 'The classifiedad has been deleted' })
  @ApiResponse({ status: 404, description: 'Classifiedad not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest): Promise<void> {
    await this.classifiedadsService.remove(id, req.user);
  }
}