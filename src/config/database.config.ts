import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  // Si estamos en producción, usar DATABASE_URL de Heroku
  if (process.env.DATABASE_URL) {
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false // Necesario para Heroku
      },
      entities: ['dist/**/*.entity{.ts,.js}'],
      synchronize: false, // En producción debería ser false
      logging: false
    };
  }

  // Configuración para desarrollo local
  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'buscadis',
    entities: ['dist/**/*.entity{.ts,.js}'],
    synchronize: true, // Solo en desarrollo
    logging: true
  };
}; 