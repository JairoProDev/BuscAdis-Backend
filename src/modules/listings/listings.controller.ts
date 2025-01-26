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
    @Request() req,
  ): Promise<ListingResponseDto> {
    const listing = await this.listingsService.createQuick(quickListingDto, req.user);
    return this.listingsService['mapToResponseDto'](listing);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new listing with full details' })
  @ApiResponse({
    status: 201,
    description: 'The listing has been successfully created.',
    type: ListingResponseDto,
  })
  async create(
    @Body() createListingDto: CreateListingDto,
    @Request() req,
  ): Promise<ListingResponseDto> {
    const listing = await this.listingsService.create(createListingDto, req.user);
    return this.listingsService['mapToResponseDto'](listing);
  }

  @Get()
  @ApiOperation({ summary: 'Get all published listings' })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of listings',
    type: [ListingResponseDto],
  })
  async findAll(): Promise<ListingResponseDto[]> {
    const listings = await this.listingsService.findAll();
    return listings.map(listing =>
      this.listingsService['mapToResponseDto'](listing),
    );
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
  async getMyListings(@Request() req): Promise<ListingResponseDto[]> {
    const searchDto: SearchListingDto = {
      ownerId: req.user.id,
      limit: 100,
    };
    const { items } = await this.listingsService.search(searchDto);
    return items;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a listing by id' })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the listing',
    type: ListingResponseDto,
  })
  async findOne(@Param('id') id: string): Promise<ListingResponseDto> {
    const listing = await this.listingsService.findOne(id);
    return this.listingsService['mapToResponseDto'](listing);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a listing' })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiResponse({
    status: 200,
    description: 'The listing has been successfully updated.',
    type: ListingResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateListingDto: UpdateListingDto,
    @Request() req,
  ): Promise<ListingResponseDto> {
    const listing = await this.listingsService.update(
      id,
      updateListingDto,
      req.user,
    );
    return this.listingsService['mapToResponseDto'](listing);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a listing' })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiResponse({
    status: 200,
    description: 'The listing has been successfully deleted.',
  })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.listingsService.remove(id, req.user);
  }
} 