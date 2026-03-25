import { MigrationInterface, QueryRunner } from 'typeorm';

export class AttendanceAccessPolicyOverrides1773210000000 implements MigrationInterface {
  name = 'AttendanceAccessPolicyOverrides1773210000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "attendance_policies"
      ADD COLUMN IF NOT EXISTS "defaultAttendanceMode" character varying(30) NOT NULL DEFAULT 'GEO_FENCE_ONLY'
    `);
    await queryRunner.query(`
      ALTER TABLE "attendance_policies"
      ADD COLUMN IF NOT EXISTS "requireRemotePunchReason" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE "attendance_policies"
      ADD COLUMN IF NOT EXISTS "allowEmployeePolicyOverride" boolean NOT NULL DEFAULT true
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "attendance_employee_policy_overrides" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "employeeId" uuid NOT NULL,
        "overrideMode" character varying(30) NOT NULL DEFAULT 'ORG_DEFAULT',
        "geoFenceExempt" boolean NOT NULL DEFAULT false,
        "remotePunchAllowed" boolean,
        "reason" text,
        "effectiveFrom" date,
        "effectiveUntil" date,
        "active" boolean NOT NULL DEFAULT true,
        "updatedBy" uuid,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_attendance_employee_policy_overrides_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_attendance_employee_policy_overrides_employeeId" UNIQUE ("employeeId")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "attendance_employee_policy_overrides"
      ADD CONSTRAINT "FK_attendance_employee_policy_overrides_employee"
      FOREIGN KEY ("employeeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_attendance_employee_policy_overrides_active"
      ON "attendance_employee_policy_overrides" ("active", "effectiveFrom", "effectiveUntil")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_attendance_employee_policy_overrides_active"
    `);
    await queryRunner.query(`
      ALTER TABLE "attendance_employee_policy_overrides"
      DROP CONSTRAINT IF EXISTS "FK_attendance_employee_policy_overrides_employee"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "attendance_employee_policy_overrides"
    `);
    await queryRunner.query(`
      ALTER TABLE "attendance_policies" DROP COLUMN IF EXISTS "allowEmployeePolicyOverride"
    `);
    await queryRunner.query(`
      ALTER TABLE "attendance_policies" DROP COLUMN IF EXISTS "requireRemotePunchReason"
    `);
    await queryRunner.query(`
      ALTER TABLE "attendance_policies" DROP COLUMN IF EXISTS "defaultAttendanceMode"
    `);
  }
}

