import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './storage.service';
import awsConfig from '../../config/aws.config';

@Module({
  imports: [ConfigModule.forFeature(awsConfig)],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {} 
