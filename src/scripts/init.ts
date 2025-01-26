import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../app.module';
import { SearchService } from '../modules/search/search.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const searchService = app.get(SearchService);

  try {
    // Initialize Elasticsearch index
    console.log('Initializing Elasticsearch index...');
    await searchService.createIndex();
    console.log('Elasticsearch index initialized successfully');

    // Add more initialization tasks here if needed
    // For example:
    // - Create default admin user
    // - Create default categories
    // - Import initial data
    // - etc.

  } catch (error) {
    console.error('Error during initialization:', error);
    process.exit(1);
  }

  await app.close();
  process.exit(0);
}

bootstrap(); 