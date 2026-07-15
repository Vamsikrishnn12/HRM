import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmployeeOffboarding1784200000000 implements MigrationInterface {
  name = 'AddEmployeeOffboarding1784200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_profiles" ADD COLUMN IF NOT EXISTS "employmentStatus" character varying(20) NOT NULL DEFAULT 'ACTIVE'`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_profiles" ADD COLUMN IF NOT EXISTS "lastWorkingDate" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_profiles" ADD COLUMN IF NOT EXISTS "offboardingReason" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_profiles" ADD COLUMN IF NOT EXISTS "offboardingNotes" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_profiles" ADD COLUMN IF NOT EXISTS "offboardedAt" timestamp`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "employee_profiles" DROP COLUMN IF EXISTS "offboardedAt"`);
    await queryRunner.query(`ALTER TABLE "employee_profiles" DROP COLUMN IF EXISTS "offboardingNotes"`);
    await queryRunner.query(`ALTER TABLE "employee_profiles" DROP COLUMN IF EXISTS "offboardingReason"`);
    await queryRunner.query(`ALTER TABLE "employee_profiles" DROP COLUMN IF EXISTS "lastWorkingDate"`);
    await queryRunner.query(`ALTER TABLE "employee_profiles" DROP COLUMN IF EXISTS "employmentStatus"`);
  }
}
