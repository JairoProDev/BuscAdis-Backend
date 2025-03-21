import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../app.module';
import { PublicationsService } from 'src/modules/publications/publications.service';
import { CategoriesService } from 'src/modules/categories/categories.service';
import { UsersService } from 'src/modules/users/users.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const configService = app.get(ConfigService);
  const publicationsService = app.get(PublicationsService);
  const categoriesService = app.get(CategoriesService);
  const usersService = app.get(UsersService);

  try {
    // Initialize services
    console.log('Initializing services...');
    await publicationsService.initialize();
    await categoriesService.initialize();
    await usersService.initialize();

    console.log('Services initialized successfully');

  } catch (error) {
    console.error('Error during initialization:', error);
    process.exit(1);
  }

  await app.close();
  process.exit(0);
}

bootstrap();