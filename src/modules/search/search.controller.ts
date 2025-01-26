import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchService } from './search.service';
import { SearchDto, SearchResponseDto } from './dto/search.dto';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search listings with advanced filters' })
  @ApiResponse({
    status: 200,
    description: 'Returns search results with aggregations',
    type: SearchResponseDto,
  })
  async search(@Query() searchDto: SearchDto): Promise<SearchResponseDto> {
    return this.searchService.search(searchDto);
  }

  @Post('index')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or update the search index' })
  @ApiResponse({
    status: 200,
    description: 'The search index has been created or updated.',
  })
  async createIndex(): Promise<void> {
    return this.searchService.createIndex();
  }
} 