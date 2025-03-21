import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicationsService } from './publications.service';
import { PublicationsController } from './publications.controller';
import { Publication } from './entities/publication.entity';
import { Category } from '../categories/entities/category.entity';
import { ImagesModule } from '../images/images.module';
import { RedisCacheModule } from '../cache/cache.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Publication, Category]),
    ImagesModule,
    RedisCacheModule,
    StorageModule,
  ],
  providers: [PublicationsService],
  controllers: [PublicationsController],
  exports: [PublicationsService],
})
export class PublicationsModule {} 

