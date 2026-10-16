import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1791723551764 implements MigrationInterface {
  name = 'Init1791723551764';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // uuid_generate_v4() below needs this; idempotent, and makes the
    // migration self-contained on a brand-new database.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE "media" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "entity_id" uuid, "entity_type" character varying(20), "name" character varying(255) NOT NULL, "path" character varying(512) NOT NULL, "size" integer NOT NULL, "mime" character varying(127) NOT NULL, "uploaded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f4e0fcac36e050de337b670d8bd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c0dd13ee4ffc96e61bdc1fb592" ON "media"  ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_811a9290bda71dee247c8656e6" ON "media"  ("entity_type", "entity_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "otps" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" integer NOT NULL, "email" character varying(255), "phone" character varying(20), "is_verified" boolean NOT NULL DEFAULT false, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_91fef5ed60605b854a2115d2410" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_otps_email" ON "otps"  ("email") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_otps_phone" ON "otps"  ("phone") `,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "avatar_id" uuid, "phone_no" character varying(20) NOT NULL, "email" character varying(255), "gender" character varying(10), "referral_code" character varying(32), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_phone_no" ON "users"  ("phone_no") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_email" ON "users"  ("email") `,
    );
    await queryRunner.query(
      `CREATE TABLE "workers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "phone_no" character varying(20) NOT NULL, "email" character varying(255), "name" character varying(120), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_e950c9aba3bd84a4f193058d838" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_workers_phone_no" ON "workers"  ("phone_no") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_workers_email" ON "workers"  ("email") `,
    );
    await queryRunner.query(
      `CREATE TABLE "workshops" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "phone_no" character varying(20) NOT NULL, "email" character varying(255), "name" character varying(160), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_6d0e82a124f5b53df91c8989848" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_workshops_phone_no" ON "workshops"  ("phone_no") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_workshops_email" ON "workshops"  ("email") `,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_c3401836efedec3bec459c8f818" FOREIGN KEY ("avatar_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_c3401836efedec3bec459c8f818"`,
    );
    await queryRunner.query(`DROP INDEX "public"."UQ_workshops_email"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_workshops_phone_no"`);
    await queryRunner.query(`DROP TABLE "workshops"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_workers_email"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_workers_phone_no"`);
    await queryRunner.query(`DROP TABLE "workers"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_users_email"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_users_phone_no"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_otps_phone"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_otps_email"`);
    await queryRunner.query(`DROP TABLE "otps"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_811a9290bda71dee247c8656e6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c0dd13ee4ffc96e61bdc1fb592"`,
    );
    await queryRunner.query(`DROP TABLE "media"`);
  }
}
