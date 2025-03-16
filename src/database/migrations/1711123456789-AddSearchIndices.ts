import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSearchIndices1711123456789 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Índices para búsqueda
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_classifiedad_title ON classifiedads (title);
      CREATE INDEX IF NOT EXISTS idx_classifiedad_description ON classifiedads (description);
      CREATE INDEX IF NOT EXISTS idx_classifiedad_price ON classifiedads (price);
      CREATE INDEX IF NOT EXISTS idx_classifiedad_created_at ON classifiedads (created_at);
      CREATE INDEX IF NOT EXISTS idx_classifiedad_is_active ON classifiedads (is_active);
    `);

    // Índices para relaciones
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_classifiedad_seller_id ON classifiedads (seller_id);
      CREATE INDEX IF NOT EXISTS idx_classifiedad_category_id ON classifiedad_categories_category (classifiedad_id, category_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_classifiedad_title;
      DROP INDEX IF EXISTS idx_classifiedad_description;
      DROP INDEX IF EXISTS idx_classifiedad_price;
      DROP INDEX IF EXISTS idx_classifiedad_created_at;
      DROP INDEX IF EXISTS idx_classifiedad_is_active;
      DROP INDEX IF EXISTS idx_classifiedad_seller_id;
      DROP INDEX IF EXISTS idx_classifiedad_category_id;
    `);
  }
} 