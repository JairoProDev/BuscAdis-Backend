import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSearchIndices1711123456789 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Índices para búsqueda
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_publication_title ON publications (title);
      CREATE INDEX IF NOT EXISTS idx_publication_description ON publications (description);
      CREATE INDEX IF NOT EXISTS idx_publication_price ON publications (price);
      CREATE INDEX IF NOT EXISTS idx_publication_created_at ON publications (created_at);
      CREATE INDEX IF NOT EXISTS idx_publication_is_active ON publications (is_active);
    `);

    // Índices para relaciones
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_publication_seller_id ON publications (seller_id);
      CREATE INDEX IF NOT EXISTS idx_publication_category_id ON publication_categories_category (publication_id, category_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_publication_title;
      DROP INDEX IF EXISTS idx_publication_description;
      DROP INDEX IF EXISTS idx_publication_price;
      DROP INDEX IF EXISTS idx_publication_created_at;
      DROP INDEX IF EXISTS idx_publication_is_active;
      DROP INDEX IF EXISTS idx_publication_seller_id;
      DROP INDEX IF EXISTS idx_publication_category_id;
    `);
  }
} 