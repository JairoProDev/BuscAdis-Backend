import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { Listing } from './entities/listing.entity';
import { Category } from '../categories/entities/category.entity';
import { ImagesModule } from '../images/images.module';
import { RedisCacheModule } from '../cache/cache.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Listing, Category]),
    ImagesModule,
    RedisCacheModule,
    StorageModule,
  ],
  providers: [ListingsService],
  controllers: [ListingsController],
  exports: [ListingsService],
})
export class ListingsModule {} 

