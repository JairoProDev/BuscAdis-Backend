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
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  SearchProductsDto,
  ProductResponseDto,
} from './dto/product.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    description: 'The product has been successfully created.',
    type: ProductResponseDto,
  })
  async create(
    @Body() createProductDto: CreateProductDto,
    @Request() req,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.create(createProductDto, req.user);
    return this.productsService['mapToResponseDto'](product);
  }

  @Get()
  @ApiOperation({ summary: 'Get all published products' })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of products',
    type: [ProductResponseDto],
  })
  async findAll(): Promise<ProductResponseDto[]> {
    const products = await this.productsService.findAll();
    return products.map(product =>
      this.productsService['mapToResponseDto'](product),
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products with filters' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated search results',
  })
  async search(@Query() searchDto: SearchProductsDto) {
    return this.productsService.search(searchDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the product',
    type: ProductResponseDto,
  })
  async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    const product = await this.productsService.findOne(id);
    return this.productsService['mapToResponseDto'](product);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'The product has been successfully updated.',
    type: ProductResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Request() req,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.update(
      id,
      updateProductDto,
      req.user,
    );
    return this.productsService['mapToResponseDto'](product);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'The product has been successfully deleted.',
  })
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.productsService.remove(id, req.user);
  }
} 