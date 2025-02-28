import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSearchIndices1711123456789 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Índices para búsqueda
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_listing_title ON listings (title);
      CREATE INDEX IF NOT EXISTS idx_listing_description ON listings (description);
      CREATE INDEX IF NOT EXISTS idx_listing_price ON listings (price);
      CREATE INDEX IF NOT EXISTS idx_listing_created_at ON listings (created_at);
      CREATE INDEX IF NOT EXISTS idx_listing_is_active ON listings (is_active);
    `);

    // Índices para relaciones
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_listing_seller_id ON listings (seller_id);
      CREATE INDEX IF NOT EXISTS idx_listing_category_id ON listing_categories_category (listing_id, category_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_listing_title;
      DROP INDEX IF EXISTS idx_listing_description;
      DROP INDEX IF EXISTS idx_listing_price;
      DROP INDEX IF EXISTS idx_listing_created_at;
      DROP INDEX IF EXISTS idx_listing_is_active;
      DROP INDEX IF EXISTS idx_listing_seller_id;
      DROP INDEX IF EXISTS idx_listing_category_id;
    `);
  }
} 