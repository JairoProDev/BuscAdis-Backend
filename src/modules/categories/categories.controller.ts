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
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryTreeDto,
  MoveCategoryDto,
} from './dto/category.dto';
import { Category } from './entities/category.entity';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Categories')
@Controller('categories')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Category created successfully' })
  create(@Body() createCategoryDto: CreateCategoryDto): Promise<Category> {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return all categories' })
  findAll(): Promise<Category[]> {
    return this.categoriesService.findAll();
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get category tree' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return category tree' })
  getTree(): Promise<CategoryTreeDto[]> {
    return this.categoriesService.getTree();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search categories' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return search results' })
  @ApiQuery({ name: 'query', required: true })
  search(@Query('query') query: string) {
    return this.categoriesService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return the category' })
  findOne(@Param('id') id: string): Promise<Category> {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Category updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Patch(':id/move')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Move category to new parent' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Category moved successfully' })
  move(
    @Param('id') id: string,
    @Body() moveCategoryDto: MoveCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.move(id, moveCategoryDto.newParentId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete category' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Category deleted successfully' })
  remove(@Param('id') id: string): Promise<void> {
    return this.categoriesService.remove(id);
  }
} 