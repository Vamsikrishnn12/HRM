import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmployeeProductTour1785300000000 implements MigrationInterface {
  name = 'AddEmployeeProductTour1785300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "employeeTourCompleted" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "employeeTourCompleted" SET DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "employeeTourCompleted"`);
  }
}
