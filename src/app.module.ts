import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SearchModule } from './modules/search/search.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { MessagesModule } from './modules/messages/messages.module';
import { ListingsModule } from './modules/listings/listings.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { getTypeOrmConfig } from './config/typeorm.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),

    // Elasticsearch
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        node: configService.get('ELASTICSEARCH_NODE', 'http://localhost:9200'),
        auth: {
          username: configService.get('ELASTICSEARCH_USERNAME', ''),
          password: configService.get('ELASTICSEARCH_PASSWORD', ''),
        },
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    SearchModule,
    CategoriesModule,
    ProductsModule,
    FavoritesModule,
    MessagesModule,
    ListingsModule,
    ReportsModule,
    NotificationsModule,
  ],
})
export class AppModule {} 
