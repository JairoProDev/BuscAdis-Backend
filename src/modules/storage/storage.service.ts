import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { v4 as uuid } from 'uuid';
import * as sharp from 'sharp';
import { UploadResult } from './interfaces/upload-result.interface';

@Injectable()
export class StorageService {
  private readonly s3: S3;
  private readonly bucketName: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly configService: ConfigService) {
    const bucketName = this.configService.get<string>('aws.s3.bucket');
    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET environment variable is not set');
    }
    this.bucketName = bucketName;

    this.s3 = new S3({
      accessKeyId: this.configService.get<string>('aws.accessKeyId'),
      secretAccessKey: this.configService.get<string>('aws.secretAccessKey'),
      region: this.configService.get<string>('aws.region'),
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<UploadResult> {
    try {
      const optimizedBuffer = await this.optimizeImage(file.buffer);
      const thumbnailBuffer = await this.createThumbnail(file.buffer);
      
      const fileExtension = 'webp';
      const fileName = `${uuid()}.${fileExtension}`;
      const thumbnailName = `thumbnails/${uuid()}.${fileExtension}`;

      // Upload optimized image
      await this.s3.upload({
        Bucket: this.bucketName,
        Key: fileName,
        Body: optimizedBuffer,
        ContentType: 'image/webp',
        ACL: 'public-read',
      }).promise();

      // Upload thumbnail
      await this.s3.upload({
        Bucket: this.bucketName,
        Key: thumbnailName,
        Body: thumbnailBuffer,
        ContentType: 'image/webp',
        ACL: 'public-read',
      }).promise();

      return {
        url: `https://${this.bucketName}.s3.amazonaws.com/${fileName}`,
        thumbnail: `https://${this.bucketName}.s3.amazonaws.com/${thumbnailName}`,
        key: fileName,
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to upload file: ${err.message}`, err.stack);
      throw new BadRequestException('Failed to upload file');
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      // Delete main image
      await this.s3.deleteObject({
        Bucket: this.bucketName,
        Key: key,
      }).promise();

      // Delete thumbnail if exists
      const thumbnailKey = `thumbnails/${key}`;
      await this.s3.deleteObject({
        Bucket: this.bucketName,
        Key: thumbnailKey,
      }).promise();
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to delete file: ${err.message}`, err.stack);
      throw new BadRequestException('Failed to delete file');
    }
  }

  private async optimizeImage(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .resize(800, 800, { fit: 'inside' })
      .webp({ quality: 80 })
      .toBuffer();
  }

  private async createThumbnail(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .resize(200, 200, { fit: 'cover' })
      .webp({ quality: 60 })
      .toBuffer();
  }

  getBucketName(): string {
    // Return the name of the bucket
    return 'your-bucket-name'; // Replace with your actual bucket name
  }
} 
