// src/modules/images/images.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Image } from './entities/image.entity';
import { CreateImageDto, UpdateImageDto } from './dto/image.dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ImagesService {
  constructor(
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
    private readonly storageService: StorageService,
  ) {}

  // ... (método create) ...

  async findAll(): Promise<Image[]> {
    return this.imageRepository.find();
  }

  async findOne(id: string): Promise<Image> {
    const image = await this.imageRepository.findOne({ where: { id } });
    if (!image) {
      throw new NotFoundException(`Image with ID ${id} not found`);
    }
    return image;
  }

  async update(id: string, updateImageDto: UpdateImageDto): Promise<Image> {
    const image = await this.findOne(id);
    Object.assign(image, updateImageDto);
    return this.imageRepository.save(image);
  }

  async remove(id: string): Promise<void> {
    const image = await this.findOne(id);
    await this.storageService.deleteFile(image.key);
    await this.imageRepository.remove(image);
  }

  async findByListingId(listingId: string): Promise<Image[]> {
    return this.imageRepository.find({
      where: { listingId },
      order: { order: 'ASC' },
    });
  }

  async validateImages(images: Image[]): Promise<void> {
    for (const image of images) {
      if (!image.mimeType || !['image/jpeg', 'image/png', 'image/webp'].includes(image.mimeType)) {
        throw new BadRequestException('Invalid image format');
      }
    }
  }

  getBucketName(): string {
    return this.storageService.getBucketName();
  }
}