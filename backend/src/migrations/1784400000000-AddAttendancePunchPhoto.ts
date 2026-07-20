import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAttendancePunchPhoto1784400000000 implements MigrationInterface {
  name = 'AddAttendancePunchPhoto1784400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attendance_punches" ADD "photoUrl" character varying(1000)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "attendance_punches" DROP COLUMN "photoUrl"`);
  }
}
