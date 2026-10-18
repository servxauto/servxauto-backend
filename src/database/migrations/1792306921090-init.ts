import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1792306921090 implements MigrationInterface {
    name = 'Init1792306921090'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "media" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid, "entity_id" uuid, "entity_type" character varying(20), "name" character varying(255) NOT NULL, "path" character varying(512) NOT NULL, "size" integer NOT NULL, "mime" character varying(127) NOT NULL, "uploaded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f4e0fcac36e050de337b670d8bd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c0dd13ee4ffc96e61bdc1fb592" ON "media"  ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_811a9290bda71dee247c8656e6" ON "media"  ("entity_type", "entity_id") `);
        await queryRunner.query(`CREATE TABLE "otps" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" integer NOT NULL, "email" character varying(255), "phone" character varying(20), "is_verified" boolean NOT NULL DEFAULT false, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_91fef5ed60605b854a2115d2410" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_otps_email" ON "otps"  ("email") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_otps_phone" ON "otps"  ("phone") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255), "avatar_id" uuid, "phone_no" character varying(20) NOT NULL, "email" character varying(255), "gender" character varying(10), "referral_code" character varying(32), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_users_phone_no" ON "users"  ("phone_no") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_users_email" ON "users"  ("email") `);
        await queryRunner.query(`CREATE TABLE "vehicle_images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "vehicle_id" uuid NOT NULL, "media_id" uuid NOT NULL, "position" smallint NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_62a037bce2dae7af30fc41cc984" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "vehicles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "vehicle_no" character varying(20) NOT NULL, "brand" character varying(100) NOT NULL, "model" character varying(100) NOT NULL, "fuel_type" character varying(20) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_vehicles_user_id" ON "vehicles"  ("user_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_vehicles_user_id_vehicle_no" ON "vehicles"  ("user_id", "vehicle_no") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE TABLE "workers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "phone_no" character varying(20) NOT NULL, "email" character varying(255), "name" character varying(120), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_e950c9aba3bd84a4f193058d838" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_workers_phone_no" ON "workers"  ("phone_no") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_workers_email" ON "workers"  ("email") `);
        await queryRunner.query(`CREATE TABLE "workshop_addresses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workshop_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "formatted_address" text NOT NULL, "latitude" double precision NOT NULL, "longitude" double precision NOT NULL, "shop_no" character varying(120) NOT NULL, "landmark" character varying(160), "city" character varying(120), "state" character varying(120), "postal_code" character varying(20), "country" character varying(120), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "REL_1a59937d22d97059a7d946aa47" UNIQUE ("workshop_id"), CONSTRAINT "PK_77256c1e65a1ed168ee6f45f05f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "workshop_agreements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workshop_id" uuid NOT NULL, "type" character varying(40) NOT NULL, "version" character varying(20) NOT NULL, "accepted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e81929c48bc121b0a484a3f8cb1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_workshop_agreements_workshop_id_type_version" ON "workshop_agreements"  ("workshop_id", "type", "version") `);
        await queryRunner.query(`CREATE TABLE "workshop_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workshop_id" uuid NOT NULL, "media_id" uuid NOT NULL, "document_key" character varying(50) NOT NULL, "sort_order" smallint NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b84f2568d112f09d27020d25a47" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_workshop_documents_workshop_id_document_key" ON "workshop_documents"  ("workshop_id", "document_key") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_workshop_documents_workshop_id_media_id" ON "workshop_documents"  ("workshop_id", "media_id") `);
        await queryRunner.query(`CREATE TABLE "workshop_images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workshop_id" uuid NOT NULL, "media_id" uuid NOT NULL, "position" smallint NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c8d62c2315958fdd732b80a8cd0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_workshop_images_workshop_id_media_id" ON "workshop_images"  ("workshop_id", "media_id") `);
        await queryRunner.query(`CREATE TABLE "workshop_working_hours" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workshop_id" uuid NOT NULL, "day" character varying(3) NOT NULL, "is_open" boolean NOT NULL DEFAULT false, "opens_at" TIME, "closes_at" TIME, CONSTRAINT "PK_29d64a8e957e6697a2ba572bb4c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_workshop_working_hours_workshop_id_day" ON "workshop_working_hours"  ("workshop_id", "day") `);
        await queryRunner.query(`CREATE TABLE "workshops" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "phone_no" character varying(20) NOT NULL, "email" character varying(255), "business_name" character varying(160), "owner_name" character varying(120), "gst_no" character varying(15), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_6d0e82a124f5b53df91c8989848" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_workshops_phone_no" ON "workshops"  ("phone_no") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_workshops_email" ON "workshops"  ("email") `);
        await queryRunner.query(`CREATE TABLE "workshop_applications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workshop_id" uuid NOT NULL, "current_step" character varying(30) NOT NULL DEFAULT 'business_details', "status" character varying(20) NOT NULL DEFAULT 'in_progress', "phone_no_verified_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "business_details_completed_at" TIMESTAMP WITH TIME ZONE, "shop_location_completed_at" TIMESTAMP WITH TIME ZONE, "documents_completed_at" TIMESTAMP WITH TIME ZONE, "working_hours_completed_at" TIMESTAMP WITH TIME ZONE, "reviewed_at" TIMESTAMP WITH TIME ZONE, "agreements_accepted_at" TIMESTAMP WITH TIME ZONE, "submitted_at" TIMESTAMP WITH TIME ZONE, "approved_at" TIMESTAMP WITH TIME ZONE, "rejection_reason" text, "document_requirements" jsonb NOT NULL DEFAULT '[]', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "REL_2c7f7ea3cd74fb0d58af18fc0b" UNIQUE ("workshop_id"), CONSTRAINT "PK_73935c1e4b7f9442f7f73146a6f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_workshop_applications_workshop_id" ON "workshop_applications"  ("workshop_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_workshop_applications_status" ON "workshop_applications"  ("status") `);
        await queryRunner.query(`CREATE TABLE "workshop_document_requirements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying(50) NOT NULL, "name" character varying(100) NOT NULL, "description" text, "min_images" smallint NOT NULL, "max_images" smallint NOT NULL, "is_required" boolean NOT NULL DEFAULT true, "sort_order" smallint NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b8ade3425d2c2056627613ecce1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_workshop_document_requirements_key" ON "workshop_document_requirements"  ("key") `);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_c3401836efedec3bec459c8f818" FOREIGN KEY ("avatar_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicle_images" ADD CONSTRAINT "FK_0fcb9e0a442f0789daf320ccc1f" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicle_images" ADD CONSTRAINT "FK_bee1a0dff50d6457e5f4d51d199" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_88b36924d769e4df751bcfbf249" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workshop_addresses" ADD CONSTRAINT "FK_1a59937d22d97059a7d946aa47e" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workshop_agreements" ADD CONSTRAINT "FK_cf6c531442060d89235ae50828b" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workshop_documents" ADD CONSTRAINT "FK_1e3313efc689275ff03848da002" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workshop_documents" ADD CONSTRAINT "FK_2ee5afdd113163e8002509d73a8" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workshop_images" ADD CONSTRAINT "FK_eb245a2912a349b3fd9c1d07613" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workshop_images" ADD CONSTRAINT "FK_cef636b39251f661557f6ffb599" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workshop_working_hours" ADD CONSTRAINT "FK_7d1d20869f25f56fba763b177f5" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workshop_applications" ADD CONSTRAINT "FK_2c7f7ea3cd74fb0d58af18fc0b6" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workshop_applications" DROP CONSTRAINT "FK_2c7f7ea3cd74fb0d58af18fc0b6"`);
        await queryRunner.query(`ALTER TABLE "workshop_working_hours" DROP CONSTRAINT "FK_7d1d20869f25f56fba763b177f5"`);
        await queryRunner.query(`ALTER TABLE "workshop_images" DROP CONSTRAINT "FK_cef636b39251f661557f6ffb599"`);
        await queryRunner.query(`ALTER TABLE "workshop_images" DROP CONSTRAINT "FK_eb245a2912a349b3fd9c1d07613"`);
        await queryRunner.query(`ALTER TABLE "workshop_documents" DROP CONSTRAINT "FK_2ee5afdd113163e8002509d73a8"`);
        await queryRunner.query(`ALTER TABLE "workshop_documents" DROP CONSTRAINT "FK_1e3313efc689275ff03848da002"`);
        await queryRunner.query(`ALTER TABLE "workshop_agreements" DROP CONSTRAINT "FK_cf6c531442060d89235ae50828b"`);
        await queryRunner.query(`ALTER TABLE "workshop_addresses" DROP CONSTRAINT "FK_1a59937d22d97059a7d946aa47e"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_88b36924d769e4df751bcfbf249"`);
        await queryRunner.query(`ALTER TABLE "vehicle_images" DROP CONSTRAINT "FK_bee1a0dff50d6457e5f4d51d199"`);
        await queryRunner.query(`ALTER TABLE "vehicle_images" DROP CONSTRAINT "FK_0fcb9e0a442f0789daf320ccc1f"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_c3401836efedec3bec459c8f818"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_workshop_document_requirements_key"`);
        await queryRunner.query(`DROP TABLE "workshop_document_requirements"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_workshop_applications_status"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_workshop_applications_workshop_id"`);
        await queryRunner.query(`DROP TABLE "workshop_applications"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_workshops_email"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_workshops_phone_no"`);
        await queryRunner.query(`DROP TABLE "workshops"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_workshop_working_hours_workshop_id_day"`);
        await queryRunner.query(`DROP TABLE "workshop_working_hours"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_workshop_images_workshop_id_media_id"`);
        await queryRunner.query(`DROP TABLE "workshop_images"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_workshop_documents_workshop_id_media_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_workshop_documents_workshop_id_document_key"`);
        await queryRunner.query(`DROP TABLE "workshop_documents"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_workshop_agreements_workshop_id_type_version"`);
        await queryRunner.query(`DROP TABLE "workshop_agreements"`);
        await queryRunner.query(`DROP TABLE "workshop_addresses"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_workers_email"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_workers_phone_no"`);
        await queryRunner.query(`DROP TABLE "workers"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_vehicles_user_id_vehicle_no"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_vehicles_user_id"`);
        await queryRunner.query(`DROP TABLE "vehicles"`);
        await queryRunner.query(`DROP TABLE "vehicle_images"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_users_email"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_users_phone_no"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_otps_phone"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_otps_email"`);
        await queryRunner.query(`DROP TABLE "otps"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_811a9290bda71dee247c8656e6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c0dd13ee4ffc96e61bdc1fb592"`);
        await queryRunner.query(`DROP TABLE "media"`);
    }

}
