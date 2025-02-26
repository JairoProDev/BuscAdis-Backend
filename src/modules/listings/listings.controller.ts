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
  ParseUUIDPipe, // Importante: Añade ParseUUIDPipe
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ListingsService } from './listings.service';
import {
  QuickListingDto,
  CreateListingDto,
  UpdateListingDto,
  SearchListingDto,
  ListingResponseDto,
} from './dto/listing.dto';
import { AuthenticatedRequest } from 'src/common/types/request.type'; // Importa AuthenticatedRequest

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post('quick')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new listing quickly with minimal information' })
  @ApiResponse({
    status: 201,
    description: 'The listing has been successfully created.',
    type: ListingResponseDto,
  })
  async createQuick(
    @Body() quickListingDto: QuickListingDto,
    @Request() req: AuthenticatedRequest, // Usa AuthenticatedRequest
  ): Promise<ListingResponseDto> {
    const listing = await this.listingsService.createQuick(quickListingDto, req.user);
    return this.listingsService['mapToResponseDto'](listing);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new listing' })
  @ApiResponse({ status: 201, description: 'The listing has been created', type: ListingResponseDto })
  async create(
      @Body() createListingDto: CreateListingDto,
      @Request() req: AuthenticatedRequest, // Usa AuthenticatedRequest
    ): Promise<ListingResponseDto> { // Añade el tipo de retorno
    const listing = await this.listingsService.create(createListingDto, req.user);
    return this.listingsService.mapToResponseDto(listing);
  }

  @Get()
  @ApiOperation({ summary: 'Get all published listings' })
  @ApiResponse({ status: 200, description: 'Return all published listings', type: [ListingResponseDto] })
  async findAll(): Promise<ListingResponseDto[]> { // Añade el tipo de retorno
    const listings = await this.listingsService.findAll();
    return Promise.all(listings.map(listing => this.listingsService.mapToResponseDto(listing)));
  }

  @Get('search')
  @ApiOperation({ summary: 'Search listings with filters' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated search results',
  })
  async search(@Query() searchDto: SearchListingDto) {
    return this.listingsService.search(searchDto);
  }

  @Get('my-listings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user listings' })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of user listings',
    type: [ListingResponseDto],
  })
  async getMyListings(@Request() req: AuthenticatedRequest): Promise<ListingResponseDto[]> {
    const searchDto: SearchListingDto = {
      ownerId: req.user.id,
      limit: 100,
    };
    const { items } = await this.listingsService.search(searchDto);
    return Promise.all(items.map(item => this.listingsService.mapToResponseDto(item))); // Asegura el mapeo
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a listing by id' })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiResponse({ status: 200, description: 'Return the listing', type: ListingResponseDto })
  @ApiResponse({ status: 404, description: 'Listing not found' })
    async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ListingResponseDto> { // Añade el tipo, usa ParseUUIDPipe
    const listing = await this.listingsService.findOne(id);
    return this.listingsService.mapToResponseDto(listing);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a listing' })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiResponse({ status: 200, description: 'The listing has been updated', type: ListingResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string, // Usa ParseUUIDPipe
    @Body() updateListingDto: UpdateListingDto,
    @Request() req: AuthenticatedRequest, // Usa AuthenticatedRequest
  ): Promise<ListingResponseDto> {  // Añade tipo de retorno
    const listing = await this.listingsService.update(id, updateListingDto, req.user);
    return this.listingsService.mapToResponseDto(listing);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a listing' })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiResponse({ status: 200, description: 'The listing has been deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
    async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest): Promise<void> { // Usa ParseUUIDPipe y AuthenticatedRequest
    await this.listingsService.remove(id, req.user);
  }
}