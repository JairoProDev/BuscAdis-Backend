import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule'; // Ya es correcto
import { CacheModule } from '@nestjs/cache-manager';
import { typeOrmConfig } from './config/typeorm.config';
import { TasksModule } from './modules/tasks/tasks.module';
import { SearchModule } from './modules/search/search.module';
import { ListingsModule } from './modules/listings/listings.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(typeOrmConfig),
    ScheduleModule.forRoot(), // Correcto
    CacheModule.register(),
    TasksModule,
    ListingsModule,
    UsersModule,
  ],
})
export class AppModule {}