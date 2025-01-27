import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private readonly s3: S3;
  private readonly logger = new Logger(StorageService.name);
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3({
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get<string>('AWS_REGION'),
    });
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET');
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    try {
      const key = `${uuidv4()}-${file.originalname}`;
      
      await this.s3.upload({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      }).promise();

      return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const key = fileUrl.split('/').pop();
      
      await this.s3.deleteObject({
        Bucket: this.bucketName,
        Key: key,
      }).promise();
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`, error.stack);
      throw error;
    }
  }
} 
