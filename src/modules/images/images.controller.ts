// src/modules/images/images.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, UploadedFile, UseInterceptors, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ImagesService } from './images.service';
import { CreateImageDto, UpdateImageDto, ImageResponseDto } from './dto/image.dto';

@ApiTags('images')
@Controller('images')
@UseGuards(JwtAuthGuard)
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  // ... (método create) ...

  @Get()
  @ApiOperation({ summary: 'Get all images' })
  @ApiResponse({ status: 200, description: 'Return all images', type: [ImageResponseDto] })
  async findAll(): Promise<ImageResponseDto[]> {
    const images = await this.imagesService.findAll();
    return images.map(image => ({ ...image }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an image by id' })
  @ApiResponse({ status: 200, description: 'Return the image', type: ImageResponseDto })
  async findOne(@Param('id') id: string): Promise<ImageResponseDto> {
    const image = await this.imagesService.findOne(id);
    return { ...image };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an image' })
  @ApiResponse({ status: 200, description: 'Image updated successfully', type: ImageResponseDto })
  async update(@Param('id') id: string, @Body() updateImageDto: UpdateImageDto): Promise<ImageResponseDto> {
    const image = await this.imagesService.update(id, updateImageDto);
    return { ...image };
  }

  // ... (método remove) ...
}