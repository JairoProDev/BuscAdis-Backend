import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ImagesService } from './images.service';
import { CreateImageDto, UpdateImageDto, ImageResponseDto } from './dto/image.dto';

@ApiTags('images')
@Controller('images')
@UseGuards(JwtAuthGuard)
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new image' })
  @ApiResponse({ status: 201, description: 'Image created successfully', type: ImageResponseDto })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        listingId: {
          type: 'string',
          format: 'uuid',
        },
        order: {
          type: 'number',
        },
        alt: {
          type: 'string',
        },
      },
    },
  })
  async create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() createImageDto: CreateImageDto,
  ): Promise<ImageResponseDto> {
    return this.imagesService.create(file, createImageDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all images' })
  @ApiResponse({ status: 200, description: 'Return all images', type: [ImageResponseDto] })
  async findAll(): Promise<ImageResponseDto[]> {
    return this.imagesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an image by id' })
  @ApiResponse({ status: 200, description: 'Return the image', type: ImageResponseDto })
  async findOne(@Param('id') id: string): Promise<ImageResponseDto> {
    return this.imagesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an image' })
  @ApiResponse({ status: 200, description: 'Image updated successfully', type: ImageResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateImageDto: UpdateImageDto,
  ): Promise<ImageResponseDto> {
    return this.imagesService.update(id, updateImageDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an image' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.imagesService.remove(id);
  }
} 