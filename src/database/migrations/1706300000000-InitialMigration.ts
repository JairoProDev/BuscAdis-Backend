import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1706300000000 implements MigrationInterface {
    name = 'InitialMigration1706300000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                "firstName" character varying,
                "lastName" character varying,
                "phone" character varying,
                "isActive" boolean NOT NULL DEFAULT true,
                "isVerified" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);

        // Categories table
        await queryRunner.query(`
            CREATE TABLE "categories" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "slug" character varying NOT NULL,
                "description" text,
                "icon" character varying,
                "image" character varying,
                "isActive" boolean NOT NULL DEFAULT true,
                "metadata" jsonb,
                "parentId" uuid,
                "mpath" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_categories_slug" UNIQUE ("slug"),
                CONSTRAINT "PK_categories" PRIMARY KEY ("id")
            )
        `);

        // Classifiedads table
        await queryRunner.query(`
            CREATE TABLE "classifiedads" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying NOT NULL,
                "slug" character varying NOT NULL,
                "description" text,
                "price" numeric(10,2),
                "priceType" character varying,
                "status" character varying NOT NULL DEFAULT 'DRAFT',
                "condition" character varying,
                "attributes" jsonb,
                "images" jsonb,
                "location" jsonb,
                "views" integer NOT NULL DEFAULT 0,
                "likes" integer NOT NULL DEFAULT 0,
                "isActive" boolean NOT NULL DEFAULT true,
                "isFeatured" boolean NOT NULL DEFAULT false,
                "isVerified" boolean NOT NULL DEFAULT false,
                "metadata" jsonb,
                "userId" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "publishedAt" TIMESTAMP,
                "soldAt" TIMESTAMP,
                CONSTRAINT "UQ_classifiedads_slug" UNIQUE ("slug"),
                CONSTRAINT "PK_classifiedads" PRIMARY KEY ("id")
            )
        `);

        // Reports table
        await queryRunner.query(`
            CREATE TABLE "reports" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "reason" character varying NOT NULL,
                "description" text,
                "status" character varying NOT NULL DEFAULT 'PENDING',
                "adminNotes" text,
                "evidence" jsonb,
                "reporterId" uuid,
                "classifiedadId" uuid,
                "reviewedById" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_reports" PRIMARY KEY ("id")
            )
        `);

        // Notifications table
        await queryRunner.query(`
            CREATE TABLE "notifications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "type" character varying NOT NULL,
                "title" character varying NOT NULL,
                "message" text NOT NULL,
                "data" jsonb,
                "isRead" boolean NOT NULL DEFAULT false,
                "isActive" boolean NOT NULL DEFAULT true,
                "userId" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "readAt" TIMESTAMP,
                "expiresAt" TIMESTAMP,
                CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
            )
        `);

        // Foreign Keys
        await queryRunner.query(`
            ALTER TABLE "categories" 
            ADD CONSTRAINT "FK_categories_parent" 
            FOREIGN KEY ("parentId") 
            REFERENCES "categories"("id") 
            ON DELETE SET NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "classifiedads" 
            ADD CONSTRAINT "FK_classifiedads_user" 
            FOREIGN KEY ("userId") 
            REFERENCES "users"("id") 
            ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "reports" 
            ADD CONSTRAINT "FK_reports_reporter" 
            FOREIGN KEY ("reporterId") 
            REFERENCES "users"("id") 
            ON DELETE SET NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "reports" 
            ADD CONSTRAINT "FK_reports_classifiedad" 
            FOREIGN KEY ("classifiedadId") 
            REFERENCES "classifiedads"("id") 
            ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "reports" 
            ADD CONSTRAINT "FK_reports_reviewer" 
            FOREIGN KEY ("reviewedById") 
            REFERENCES "users"("id") 
            ON DELETE SET NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "notifications" 
            ADD CONSTRAINT "FK_notifications_user" 
            FOREIGN KEY ("userId") 
            REFERENCES "users"("id") 
            ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_user"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_reports_reviewer"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_reports_classifiedad"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_reports_reporter"`);
        await queryRunner.query(`ALTER TABLE "classifiedads" DROP CONSTRAINT "FK_classifiedads_user"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_categories_parent"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TABLE "reports"`);
        await queryRunner.query(`DROP TABLE "classifiedads"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }
} 