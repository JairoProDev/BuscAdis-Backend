import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function validateDatabase() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    // Verificar conexión
    await dataSource.query('SELECT 1');
    console.log('✅ Database connection successful');

    // Verificar tablas
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('✅ Found tables:', tables.map((t: { table_name: string }) => t.table_name));

    // Verificar índices
    const indices = await dataSource.query(`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `);
    console.log('✅ Found indices:', indices);

    await app.close();
  } catch (error) {
    console.error('❌ Database validation failed:', error);
    await app.close();
    process.exit(1);
  }
}

validateDatabase(); 