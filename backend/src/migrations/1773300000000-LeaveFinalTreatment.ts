import { MigrationInterface, QueryRunner } from 'typeorm';

export class LeaveFinalTreatment1773300000000 implements MigrationInterface {
  name = 'LeaveFinalTreatment1773300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "leave_requests" ADD COLUMN IF NOT EXISTS "approvedLeaveType" "public"."leave_requests_leavetype_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "leave_requests" ADD COLUMN IF NOT EXISTS "finalAttendanceCode" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "leave_requests" ADD COLUMN IF NOT EXISTS "suggestedLeaveType" "public"."leave_requests_leavetype_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "leave_requests" ADD COLUMN IF NOT EXISTS "treatmentNote" text`,
    );

    await queryRunner.query(`
      UPDATE "leave_requests"
      SET "suggestedLeaveType" = "leaveType"
      WHERE "suggestedLeaveType" IS NULL
    `);

    await queryRunner.query(`
      UPDATE "leave_requests"
      SET
        "approvedLeaveType" = "leaveType",
        "finalAttendanceCode" = "leaveType"::text
      WHERE "status" = 'APPROVED' AND "approvedLeaveType" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "leave_requests" DROP COLUMN IF EXISTS "treatmentNote"`);
    await queryRunner.query(`ALTER TABLE "leave_requests" DROP COLUMN IF EXISTS "suggestedLeaveType"`);
    await queryRunner.query(`ALTER TABLE "leave_requests" DROP COLUMN IF EXISTS "finalAttendanceCode"`);
    await queryRunner.query(`ALTER TABLE "leave_requests" DROP COLUMN IF EXISTS "approvedLeaveType"`);
  }
}
