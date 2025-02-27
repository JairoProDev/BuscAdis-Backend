import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Image } from './entities/image.entity';
import { S3 } from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { ImageDto } from './dto/image.dto';

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);
  private readonly s3: S3;
  private readonly bucketName: string;

  constructor(
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
    private readonly configService: ConfigService,
  ) {
    this.s3 = new S3({
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get('AWS_REGION'),
    });
    this.bucketName = this.configService.get('AWS_S3_BUCKET_NAME') || '';
  }

  async uploadImage(imageDto: ImageDto): Promise<Image> {
    try {
      const key = `listings/${uuidv4()}-${imageDto.url.split('/').pop()}`;
      const thumbnailKey = `listings/thumbnails/${uuidv4()}-${imageDto.url.split('/').pop()}`;

      // Process image and create thumbnail
      const processedImage = await sharp(Buffer.from(imageDto.url, 'base64'))
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

      const thumbnail = await sharp(Buffer.from(imageDto.url, 'base64'))
        .resize(300, 300, { fit: 'cover' })
        .jpeg({ quality: 60 })
        .toBuffer();

      // Upload original image
      await this.s3.upload({
        Bucket: this.bucketName,
        Key: key,
        Body: processedImage,
        ContentType: imageDto.mimeType,
        ACL: 'public-read',
      }).promise();

      // Upload thumbnail
      await this.s3.upload({
        Bucket: this.bucketName,
        Key: thumbnailKey,
        Body: thumbnail,
        ContentType: imageDto.mimeType,
        ACL: 'public-read',
      }).promise();

      const image = this.imageRepository.create({
        url: `https://${this.bucketName}.s3.amazonaws.com/${key}`,
        key,
        bucket: this.bucketName,
        mimeType: imageDto.mimeType,
        thumbnail: `https://${this.bucketName}.s3.amazonaws.com/${thumbnailKey}`,
        order: imageDto.order,
      });

      return this.imageRepository.save(image);
    } catch (error) {
      this.logger.error('Error uploading image:', error);
      throw error;
    }
  }

  async deleteImage(imageId: string): Promise<void> {
    const image = await this.imageRepository.findOne({ where: { id: imageId } });
    if (!image) {
      return;
    }

    try {
      await this.s3.deleteObject({
        Bucket: image.bucket,
        Key: image.key,
      }).promise();

      if (image.thumbnail) {
        const thumbnailKey = image.thumbnail.split('/').pop();
        await this.s3.deleteObject({
          Bucket: image.bucket,
          Key: `listings/thumbnails/${thumbnailKey}`,
        }).promise();
      }

      await this.imageRepository.remove(image);
    } catch (error) {
      this.logger.error('Error deleting image:', error);
      throw error;
    }
  }

  async getImageById(id: string): Promise<Image | null> {
    return this.imageRepository.findOne({ where: { id } });
  }
} 