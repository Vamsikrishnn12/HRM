import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmployeeProfilePhoto1784000000000 implements MigrationInterface {
  name = 'AddEmployeeProfilePhoto1784000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profilePhotoUrl" character varying(500)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "profilePhotoUrl"`);
  }
}
