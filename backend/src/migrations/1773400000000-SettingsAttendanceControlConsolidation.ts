import { MigrationInterface, QueryRunner } from 'typeorm';

export class SettingsAttendanceControlConsolidation1773400000000
  implements MigrationInterface
{
  name = 'SettingsAttendanceControlConsolidation1773400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "org_settings" ADD COLUMN IF NOT EXISTS "geoFenceRequired" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_settings" ADD COLUMN IF NOT EXISTS "allowRemoteAttendance" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "leave_policies" ADD COLUMN IF NOT EXISTS "maxPermissionRequestsPerMonth" integer NOT NULL DEFAULT 4`,
    );
    await queryRunner.query(
      `ALTER TABLE "leave_policies" ADD COLUMN IF NOT EXISTS "maxRegularizationsPerMonth" integer NOT NULL DEFAULT 4`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "leave_policies" DROP COLUMN IF EXISTS "maxRegularizationsPerMonth"`,
    );
    await queryRunner.query(
      `ALTER TABLE "leave_policies" DROP COLUMN IF EXISTS "maxPermissionRequestsPerMonth"`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_settings" DROP COLUMN IF EXISTS "allowRemoteAttendance"`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_settings" DROP COLUMN IF EXISTS "geoFenceRequired"`,
    );
  }
}

