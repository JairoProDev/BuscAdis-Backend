// src/modules/storage/storage.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { UploadResult } from './interfaces/upload-result.interface';

@Injectable()
export class StorageService {
    private s3Client: S3Client;
    private bucketName: string;
    private readonly logger = new Logger(StorageService.name);

    constructor(private configService: ConfigService) {
        const bucketName = this.configService.get<string>('AWS_S3_BUCKET');
        if (!bucketName) {
            this.logger.error('AWS_S3_BUCKET is not defined in the configuration.');
            throw new Error('AWS_S3_BUCKET is not defined in the configuration.');
        }
        this.bucketName = bucketName;

        const region = this.configService.get<string>('AWS_REGION');
        const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

        if (!region || !accessKeyId || !secretAccessKey) {
            this.logger.error('AWS credentials are not fully defined in the configuration.');
            throw new Error('AWS credentials are not fully defined in the configuration.');
        }

        this.s3Client = new S3Client({
            region: region,
            credentials: {
                accessKeyId: accessKeyId,
                secretAccessKey: secretAccessKey,
            },
        });
    }

    async uploadFile(file: Express.Multer.File, thumbnail?: string): Promise<UploadResult> {
        const key = `${Date.now()}-${file.originalname}`;
        const upload = new Upload({
            client: this.s3Client,
            params: {
                Bucket: this.bucketName,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
            },
        });

        await upload.done();

        return {
            url: `https://${this.bucketName}.s3.amazonaws.com/${key}`, // Construir la URL
            key: key,
            thumbnail: thumbnail || '',
        };
    }

    async deleteFile(key: string): Promise<void> {
        const params = {
            Bucket: this.bucketName,
            Key: key,
        };

        await this.s3Client.send(new DeleteObjectCommand(params));
    }

    getBucketName(): string {
        return this.bucketName;
    }
}