import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnforceNineHourAttendance1784800000000 implements MigrationInterface {
  name = 'EnforceNineHourAttendance1784800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "org_settings" ALTER COLUMN "fullDayMinMinutes" SET DEFAULT 540`,
    );
    await queryRunner.query(
      `UPDATE "org_settings" SET "fullDayMinMinutes" = 540 WHERE "fullDayMinMinutes" = 480`,
    );

    await queryRunner.query(
      `ALTER TABLE "attendance_policies" ALTER COLUMN "fullDayMinMinutes" SET DEFAULT 540`,
    );
    await queryRunner.query(
      `UPDATE "attendance_policies"
       SET "fullDayMinMinutes" = 540,
           "classificationConfig" = jsonb_set(
             COALESCE("classificationConfig", '{}'::jsonb),
             '{presentMinMinutes}',
             '540'::jsonb,
             true
           )
       WHERE "fullDayMinMinutes" = 480`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "attendance_policies"
       SET "fullDayMinMinutes" = 480,
           "classificationConfig" = jsonb_set(
             COALESCE("classificationConfig", '{}'::jsonb),
             '{presentMinMinutes}',
             '480'::jsonb,
             true
           )
       WHERE "fullDayMinMinutes" = 540`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance_policies" ALTER COLUMN "fullDayMinMinutes" SET DEFAULT 480`,
    );

    await queryRunner.query(
      `UPDATE "org_settings" SET "fullDayMinMinutes" = 480 WHERE "fullDayMinMinutes" = 540`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_settings" ALTER COLUMN "fullDayMinMinutes" SET DEFAULT 480`,
    );
  }
}
