import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { StorageModule } from '../storage/storage.module';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { Listing } from './entities/listing.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Listing]),
    ConfigModule,
    StorageModule,
  ],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {} 

