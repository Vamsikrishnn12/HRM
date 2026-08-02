import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnforcePostProbationLeaveEligibility1784900000000 implements MigrationInterface {
  name = 'EnforcePostProbationLeaveEligibility1784900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "leave_policies" ALTER COLUMN "probationLeaveAllowed" SET DEFAULT false`,
    );
    await queryRunner.query(
      `UPDATE "leave_policies" SET "probationLeaveAllowed" = false WHERE "probationLeaveAllowed" = true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // The previous employee-specific value cannot be reconstructed safely.
  }
}
