import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The owner's documents the Workshop App asks for at onboarding. Runs after
 * `WorkshopDocumentRequirements1792229018500`, which creates the table.
 */
export class SeedWorkshopDocumentRequirements1792229037841 implements MigrationInterface {
  name = 'SeedWorkshopDocumentRequirements1792229037841';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // DO NOTHING: an admin's later edit to one of these rows must survive a re-run.
    await queryRunner.query(
      `INSERT INTO "workshop_document_requirements"
         ("key", "name", "description", "min_images", "max_images", "is_required", "sort_order")
       VALUES
         ('aadhaar_card', 'Aadhaar card', 'Photo of front & back', 1, 2, true, 1),
         ('pan_card', 'PAN card', 'Photo of front & back', 1, 2, true, 2),
         ('driving_license', 'Driving license', 'Photo of front & back', 1, 2, true, 3)
       ON CONFLICT ("key") DO NOTHING`,
    );

    // Applications created before this table existed have an empty snapshot.
    await queryRunner.query(
      `UPDATE "workshop_applications"
       SET "document_requirements" = (
         SELECT COALESCE(
           jsonb_agg(
             jsonb_build_object(
               'key', "key",
               'name', "name",
               'description', "description",
               'min_images', "min_images",
               'max_images', "max_images",
               'is_required', "is_required",
               'sort_order', "sort_order"
             )
             ORDER BY "sort_order"
           ),
           '[]'::jsonb
         )
         FROM "workshop_document_requirements"
         WHERE "is_active"
       )
       WHERE "document_requirements" = '[]'::jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Snapshots already copied onto applications are left as they are.
    await queryRunner.query(
      `DELETE FROM "workshop_document_requirements"
       WHERE "key" IN ('aadhaar_card', 'pan_card', 'driving_license')`,
    );
  }
}
