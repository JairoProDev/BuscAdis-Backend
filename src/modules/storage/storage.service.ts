import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { v4 as uuid } from 'uuid';
import { ImageDto } from '../listings/dto/listing.dto';

@Injectable()
export class StorageService {
  private readonly s3: S3;
  private readonly bucketName: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly configService: ConfigService) {
    const bucketName = this.configService.get<string>('AWS_S3_BUCKET');
    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET environment variable is not set');
    }
    this.bucketName = bucketName;

    this.s3 = new S3({
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get<string>('AWS_REGION'),
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${uuid()}.${fileExtension}`;

      await this.s3.upload({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      }).promise();

      return fileName;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to upload file: ${err.message}`, err.stack);
      throw error;
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    try {
      await this.s3.deleteObject({
        Bucket: this.bucketName,
        Key: fileName,
      }).promise();
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to delete file: ${err.message}`, err.stack);
      throw error;
    }
  }

  async uploadImage(imageDto: ImageDto): Promise<string> {
    try {
      const fileName = `${uuid()}-${imageDto.url.split('/').pop()}`;
      const buffer = Buffer.from(imageDto.url, 'base64'); // Assuming the URL is a base64 string

      await this.s3.upload({
        Bucket: this.bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: imageDto.mimeType,
        ACL: 'public-read',
      }).promise();

      return `https://${this.bucketName}.s3.amazonaws.com/${fileName}`;
    } catch (error) {
      this.logger.error('Error uploading image:', error);
      throw error;
    }
  }
} 
