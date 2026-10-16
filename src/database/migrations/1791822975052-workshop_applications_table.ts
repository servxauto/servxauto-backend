import { MigrationInterface, QueryRunner } from 'typeorm';

export class WorkshopApplicationsTable1791822975052 implements MigrationInterface {
  name = 'WorkshopApplicationsTable1791822975052';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "workshop_applications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workshop_id" uuid NOT NULL, "current_step" character varying(30) NOT NULL DEFAULT 'business_details', "status" character varying(20) NOT NULL DEFAULT 'in_progress', "business_details_completed_at" TIMESTAMP WITH TIME ZONE, "shop_location_completed_at" TIMESTAMP WITH TIME ZONE, "documents_completed_at" TIMESTAMP WITH TIME ZONE, "working_hours_completed_at" TIMESTAMP WITH TIME ZONE, "reviewed_at" TIMESTAMP WITH TIME ZONE, "agreements_accepted_at" TIMESTAMP WITH TIME ZONE, "submitted_at" TIMESTAMP WITH TIME ZONE, "approved_at" TIMESTAMP WITH TIME ZONE, "rejection_reason" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "REL_2c7f7ea3cd74fb0d58af18fc0b" UNIQUE ("workshop_id"), CONSTRAINT "PK_73935c1e4b7f9442f7f73146a6f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_workshop_applications_workshop_id" ON "workshop_applications"  ("workshop_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_workshop_applications_status" ON "workshop_applications"  ("status") `,
    );
    await queryRunner.query(
      `ALTER TABLE "workshop_applications" ADD CONSTRAINT "FK_2c7f7ea3cd74fb0d58af18fc0b6" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workshop_applications" DROP CONSTRAINT "FK_2c7f7ea3cd74fb0d58af18fc0b6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_workshop_applications_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_workshop_applications_workshop_id"`,
    );
    await queryRunner.query(`DROP TABLE "workshop_applications"`);
  }
}
