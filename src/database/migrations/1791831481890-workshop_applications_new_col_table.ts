import { MigrationInterface, QueryRunner } from 'typeorm';

export class WorkshopApplicationsNewColTable1791831481890 implements MigrationInterface {
  name = 'WorkshopApplicationsNewColTable1791831481890';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workshop_applications" ADD "phone_no_verified_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workshop_applications" DROP COLUMN "phone_no_verified_at"`,
    );
  }
}
