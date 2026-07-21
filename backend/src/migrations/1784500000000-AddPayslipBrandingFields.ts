import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPayslipBrandingFields1784500000000 implements MigrationInterface {
  name = 'AddPayslipBrandingFields1784500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "org_settings" ADD COLUMN IF NOT EXISTS "companyLogoUrl" text`);
    await queryRunner.query(`ALTER TABLE "org_settings" ADD COLUMN IF NOT EXISTS "cinNumber" varchar(21)`);
    await queryRunner.query(`ALTER TABLE "org_settings" ADD COLUMN IF NOT EXISTS "gstNumber" varchar(15)`);
    await queryRunner.query(`ALTER TABLE "org_settings" ADD COLUMN IF NOT EXISTS "payslipAdditionalFields" jsonb NOT NULL DEFAULT '[]'::jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "org_settings" DROP COLUMN IF EXISTS "payslipAdditionalFields"`);
    await queryRunner.query(`ALTER TABLE "org_settings" DROP COLUMN IF EXISTS "gstNumber"`);
    await queryRunner.query(`ALTER TABLE "org_settings" DROP COLUMN IF EXISTS "cinNumber"`);
    await queryRunner.query(`ALTER TABLE "org_settings" DROP COLUMN IF EXISTS "companyLogoUrl"`);
  }
}
