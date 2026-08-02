import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmployeeDeletion1784700000000 implements MigrationInterface {
  name = 'AddEmployeeDeletion1784700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletedAt" timestamp`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "deletedAt"`);
  }
}
