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
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search classifiedads' })
  @ApiResponse({ status: 200, description: 'Return search results' })
  async search(@Query() searchDto: SearchDto): Promise<SearchResponseDto> {
    return this.searchService.searchClassifiedads(searchDto);
  }

  @Post('classifiedads')
  @ApiOperation({ summary: 'Search classifiedads' })
  @ApiResponse({
    status: 200,
    description: 'Returns search results',
    type: SearchResponseDto,
  })
  async searchClassifiedads(@Body() searchDto: SearchDto): Promise<SearchResponseDto> {
    return this.searchService.searchClassifiedads(searchDto);
  }

  @Post('create-index')
  @ApiOperation({ summary: 'Create search index' })
  @ApiResponse({
    status: 200,
    description: 'Index created successfully',
  })
  async createIndex(): Promise<void> {
    await this.searchService.createIndex();
  }

  @Post('delete-index')
  @ApiOperation({ summary: 'Delete search index' })
  @ApiResponse({
    status: 200,
    description: 'Index deleted successfully',
  })
  async deleteIndex(): Promise<void> {
    await this.searchService.deleteIndex();
  }
} 