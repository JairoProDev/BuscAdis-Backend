import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ImagesService } from './images.service';
import { Image } from './entities/image.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Image]),
    ConfigModule,
  ],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {} 