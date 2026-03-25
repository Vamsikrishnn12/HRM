import { MigrationInterface, QueryRunner } from 'typeorm';

export class PayrollRunScalabilityFields1773500000000
  implements MigrationInterface
{
  name = 'PayrollRunScalabilityFields1773500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN
        CREATE TYPE "public"."payroll_runs_runtype_enum" AS ENUM ('BULK_UPLOAD', 'SYSTEM_BULK');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
    );

    await queryRunner.query(
      `ALTER TABLE "payroll_runs" ADD COLUMN IF NOT EXISTS "runType" "public"."payroll_runs_runtype_enum" NOT NULL DEFAULT 'SYSTEM_BULK'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll_runs" ADD COLUMN IF NOT EXISTS "skippedCount" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll_runs" ADD COLUMN IF NOT EXISTS "processedCount" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll_runs" ADD COLUMN IF NOT EXISTS "emailedCount" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll_runs" ADD COLUMN IF NOT EXISTS "portalPublishedCount" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll_runs" ADD COLUMN IF NOT EXISTS "errorSummary" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payroll_runs" ADD COLUMN IF NOT EXISTS "resultSummary" jsonb NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payroll_runs" DROP COLUMN IF EXISTS "resultSummary"`);
    await queryRunner.query(`ALTER TABLE "payroll_runs" DROP COLUMN IF EXISTS "errorSummary"`);
    await queryRunner.query(`ALTER TABLE "payroll_runs" DROP COLUMN IF EXISTS "portalPublishedCount"`);
    await queryRunner.query(`ALTER TABLE "payroll_runs" DROP COLUMN IF EXISTS "emailedCount"`);
    await queryRunner.query(`ALTER TABLE "payroll_runs" DROP COLUMN IF EXISTS "processedCount"`);
    await queryRunner.query(`ALTER TABLE "payroll_runs" DROP COLUMN IF EXISTS "skippedCount"`);
    await queryRunner.query(`ALTER TABLE "payroll_runs" DROP COLUMN IF EXISTS "runType"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."payroll_runs_runtype_enum"`);
  }
}

