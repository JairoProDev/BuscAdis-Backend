import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { Classifiedad } from '../classifiedads/entities/classifiedad.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Classifiedad])],
  providers: [SearchService],
  controllers: [SearchController],
  exports: [SearchService],
})
export class SearchModule {}