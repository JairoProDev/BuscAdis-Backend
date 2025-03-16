import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInitialSchema1711123456789 implements MigrationInterface {
    name = 'CreateInitialSchema1711123456789'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                "firstName" character varying NOT NULL,
                "lastName" character varying NOT NULL,
                "phone" character varying,
                "role" character varying NOT NULL DEFAULT 'user',
                "isActive" boolean NOT NULL DEFAULT true,
                "isVerified" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);

        // Create classifiedads table
        await queryRunner.query(`
            CREATE TABLE "classifiedads" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying NOT NULL,
                "slug" character varying NOT NULL,
                "description" text NOT NULL,
                "price" numeric(10,2) NOT NULL,
                "priceType" character varying NOT NULL DEFAULT 'fixed',
                "status" character varying NOT NULL DEFAULT 'draft',
                "images" jsonb,
                "location" jsonb,
                "views" integer NOT NULL DEFAULT 0,
                "likes" integer NOT NULL DEFAULT 0,
                "isActive" boolean NOT NULL DEFAULT true,
                "isUrgent" boolean NOT NULL DEFAULT false,
                "sellerId" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "publishedAt" TIMESTAMP,
                "soldAt" TIMESTAMP,
                CONSTRAINT "UQ_classifiedads_slug" UNIQUE ("slug"),
                CONSTRAINT "PK_classifiedads" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key for classifiedads to users
        await queryRunner.query(`
            ALTER TABLE "classifiedads" 
            ADD CONSTRAINT "FK_classifiedads_seller" 
            FOREIGN KEY ("sellerId") 
            REFERENCES "users"("id") 
            ON DELETE SET NULL 
            ON UPDATE NO ACTION
        `);

        // Create extension for UUID generation if it doesn't exist
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "classifiedads" DROP CONSTRAINT "FK_classifiedads_seller"`);
        await queryRunner.query(`DROP TABLE "classifiedads"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP EXTENSION "uuid-ossp"`);
    }
} 