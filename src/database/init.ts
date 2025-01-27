import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { initializeElasticsearch } from './elasticsearch/init';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
    const dataSource = app.get(DataSource);

    try {
        // Run database migrations
        console.log('Running database migrations...');
        await dataSource.runMigrations();
        console.log('Database migrations completed successfully');

        // Initialize Elasticsearch
        console.log('Initializing Elasticsearch...');
        await initializeElasticsearch(configService);
        console.log('Elasticsearch initialization completed successfully');

        await app.close();
        process.exit(0);
    } catch (error) {
        console.error('Error during initialization:', error);
        await app.close();
        process.exit(1);
    }
}

bootstrap(); 