import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassifiedadsService } from './classifiedads.service';
import { ClassifiedadsController } from './classifiedads.controller';
import { Classifiedad } from './entities/classifiedad.entity';
import { Category } from '../categories/entities/category.entity';
import { ImagesModule } from '../images/images.module';
import { RedisCacheModule } from '../cache/cache.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Classifiedad, Category]),
    ImagesModule,
    RedisCacheModule,
    StorageModule,
  ],
  providers: [ClassifiedadsService],
  controllers: [ClassifiedadsController],
  exports: [ClassifiedadsService],
})
export class ClassifiedadsModule {} 

