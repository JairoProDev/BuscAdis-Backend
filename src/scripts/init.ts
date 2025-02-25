import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../app.module';
import { ListingsService } from 'src/modules/listings/listings.service';
import { CategoriesService } from 'src/modules/categories/categories.service';
import { UsersService } from 'src/modules/users/users.service';
//import { SearchService } from '../modules/search/search.service'; // Ya no lo necesitas

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule); //  createApplicationContext
  const configService = app.get(ConfigService);
  //  SearchService. Ya no tienes SearchService, usa los servicios individuales.
  const listingsService = app.get(ListingsService);
  const categoriesService = app.get(CategoriesService);
  const usersService = app.get(UsersService)

  try {
    // Initialize Elasticsearch index
    console.log('Initializing Elasticsearch indices...');
    // await searchService.createIndex(); // Ya no, cada servicio crea su propio indice
    await listingsService['createIndex'](); // Accede al método privado
    await categoriesService['createIndex'](); //Accede al metodo
    await usersService['createIndex']();


    console.log('Elasticsearch indices initialized successfully');

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