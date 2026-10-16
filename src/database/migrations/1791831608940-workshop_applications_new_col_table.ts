import { MigrationInterface, QueryRunner } from 'typeorm';

export class WorkshopApplicationsNewColTable1791831608940 implements MigrationInterface {
  name = 'WorkshopApplicationsNewColTable1791831608940';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workshop_applications" ALTER COLUMN "phone_no_verified_at" SET DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workshop_applications" ALTER COLUMN "phone_no_verified_at" DROP DEFAULT`,
    );
  }
}
