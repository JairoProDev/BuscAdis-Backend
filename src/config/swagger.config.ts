import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const setupSwagger = (
  app: INestApplication,
  configService: ConfigService,
): void => {
  const options = new DocumentBuilder()
    .setTitle('Buscadis API')
    .setDescription('The Buscadis marketplace API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('categories', 'Category management endpoints')
    .addTag('listings', 'Listing management endpoints')
    .addTag('search', 'Search functionality endpoints')
    .addTag('favorites', 'Favorites management endpoints')
    .addTag('messages', 'Messaging system endpoints')
    .addTag('reports', 'Report management endpoints')
    .addTag('notifications', 'Notification system endpoints')
    .addServer(configService.get('apiUrl'))
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}; 