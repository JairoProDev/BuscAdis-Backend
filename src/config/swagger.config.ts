import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const setupSwagger = (
  app: INestApplication,
  configService: ConfigService,
): void => {
  const apiUrl = configService.get<string>('apiUrl'); // Lee la URL de la API, con tipo explícito

  // Mejor manejo de errores si la URL no está definida
  if (!apiUrl) {
    console.warn("API_URL is not defined. Swagger might not work correctly on a remote server. Using default: http://localhost:3000");
    // Alternativamente, puedes lanzar un error si API_URL es *obligatorio* para el funcionamiento.
    // throw new Error("API_URL environment variable is not set!");
  }

  const options = new DocumentBuilder()
    .setTitle('Buscadis API')
    .setDescription('The Buscadis marketplace API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('categories', 'Category management endpoints')
    .addTag('classifiedads', 'Classifiedad management endpoints')
    .addTag('search', 'Search functionality endpoints')
    .addTag('favorites', 'Favorites management endpoints')
    .addTag('messages', 'Messaging system endpoints')
    .addTag('reports', 'Report management endpoints')
    .addTag('notifications', 'Notification system endpoints')
    .addServer(apiUrl || 'http://localhost:3000') // Usa la URL o un valor predeterminado
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api/docs', app, document, { // La ruta donde se sirve la documentación
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
};