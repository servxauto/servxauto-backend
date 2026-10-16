import { MigrationInterface, QueryRunner } from 'typeorm';

export class UsersNameColumn1792001675305 implements MigrationInterface {
  name = 'UsersNameColumn1792001675305';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "name" character varying(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
  }
}
