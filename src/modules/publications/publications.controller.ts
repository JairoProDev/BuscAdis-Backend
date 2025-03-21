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
import { PublicationsService } from './publications.service';
import {
  QuickPublicationDto,
  CreatePublicationDto,
  UpdatePublicationDto,
  SearchPublicationDto,
  PublicationResponseDto,
} from './dto/publication.dto';
import { AuthenticatedRequest } from 'src/common/types/request.type';

@ApiTags('publications')
@Controller('publications')
export class PublicationsController {
  constructor(private readonly publicationsService: PublicationsService) {}

  @Post('quick')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new publication quickly with minimal information' })
  @ApiResponse({
    status: 201,
    description: 'The publication has been successfully created.',
    type: PublicationResponseDto,
  })
  async createQuick(
    @Body() quickPublicationDto: QuickPublicationDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<PublicationResponseDto> {
    const publication = await this.publicationsService.createQuick(quickPublicationDto, req.user);
    return this.publicationsService.mapToResponseDto(publication);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new publication' })
  @ApiResponse({ status: 201, description: 'The publication has been created', type: PublicationResponseDto })
  async create(
    @Body() createPublicationDto: CreatePublicationDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<PublicationResponseDto> {
    const publication = await this.publicationsService.create(createPublicationDto, req.user);
    return this.publicationsService.mapToResponseDto(publication);
  }

  @Get()
  @ApiOperation({ summary: 'Get all published publications' })
  @ApiResponse({ status: 200, description: 'Return all published publications', type: [PublicationResponseDto] })
  async findAll(): Promise<PublicationResponseDto[]> {
    const publications = await this.publicationsService.findAll();
    return Promise.all(publications.map(publication => this.publicationsService.mapToResponseDto(publication)));
  }

  @Get('search')
  @ApiOperation({ summary: 'Search publications with filters' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated search results',
  })
  async search(@Query() searchDto: SearchPublicationDto) {
    return this.publicationsService.search(searchDto);
  }

  @Get('my-publications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user publications' })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of user publications',
    type: [PublicationResponseDto],
  })
  async getMyPublications(@Request() req: AuthenticatedRequest): Promise<PublicationResponseDto[]> {
    const searchDto: SearchPublicationDto = {
      limit: 100,
    };
    
    const publications = await this.publicationsService.search(searchDto);
    
    // Return only the items array
    return publications.items; // Ensure this returns the correct array
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a publication by id' })
  @ApiParam({ name: 'id', description: 'Publication ID' })
  @ApiResponse({ status: 200, description: 'Return the publication', type: PublicationResponseDto })
  @ApiResponse({ status: 404, description: 'Publication not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PublicationResponseDto> {
    const publication = await this.publicationsService.findOne(id);
    return this.publicationsService.mapToResponseDto(publication);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a publication' })
  @ApiParam({ name: 'id', description: 'Publication ID' })
  @ApiResponse({ status: 200, description: 'The publication has been updated', type: PublicationResponseDto })
  @ApiResponse({ status: 404, description: 'Publication not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePublicationDto: UpdatePublicationDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<PublicationResponseDto> {
    const publication = await this.publicationsService.update(id, updatePublicationDto, req.user);
    return this.publicationsService.mapToResponseDto(publication);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a publication' })
  @ApiParam({ name: 'id', description: 'Publication ID' })
  @ApiResponse({ status: 200, description: 'The publication has been deleted' })
  @ApiResponse({ status: 404, description: 'Publication not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest): Promise<void> {
    await this.publicationsService.remove(id, req.user);
  }
}