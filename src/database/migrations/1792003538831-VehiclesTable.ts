import { MigrationInterface, QueryRunner } from 'typeorm';

export class VehiclesTable1792003538831 implements MigrationInterface {
  name = 'VehiclesTable1792003538831';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "vehicles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "vehicle_no" character varying(20) NOT NULL, "brand" character varying(100) NOT NULL, "model" character varying(100) NOT NULL, "fuel_type" character varying(20) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vehicles_user_id" ON "vehicles"  ("user_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_vehicles_user_id_vehicle_no" ON "vehicles"  ("user_id", "vehicle_no") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD CONSTRAINT "FK_88b36924d769e4df751bcfbf249" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP CONSTRAINT "FK_88b36924d769e4df751bcfbf249"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_vehicles_user_id_vehicle_no"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_vehicles_user_id"`);
    await queryRunner.query(`DROP TABLE "vehicles"`);
  }
}
